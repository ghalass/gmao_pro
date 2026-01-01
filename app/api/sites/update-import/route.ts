import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectUpdateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";
import * as XLSX from "xlsx";
import {
  validateSiteUpdateImportData,
  SiteUpdateImportResult,
  ImportError,
  ImportSummary,
} from "@/lib/validation/site-update-import.schema";
import { logImportOperation } from "@/lib/import-logger";

const the_resource = "site";

export async function POST(request: NextRequest) {
  try {
    const protectionError = await protectUpdateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    // Parse le multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          message: "Type de fichier non supporté. Utilisez .xlsx, .xls ou .csv",
        },
        { status: 400 }
      );
    }

    // Lire le fichier Excel
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });

    // Prendre la première feuille
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json(
        { message: "Le fichier ne contient aucune feuille de calcul" },
        { status: 400 }
      );
    }

    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length < 2) {
      return NextResponse.json(
        { message: "Le fichier doit contenir au moins une ligne de données" },
        { status: 400 }
      );
    }

    // Extraire les en-têtes et les données
    const headers = jsonData[0] as string[];
    const rows = jsonData.slice(1);

    // Mapper les colonnes vers les champs attendus
    const mappedData = rows.map((row: any) => {
      const mapped: any = {};

      headers.forEach((header, index) => {
        const normalizedHeader = header.toLowerCase().trim();

        // Mapping flexible des noms de colonnes
        if (
          normalizedHeader.includes("nom") &&
          normalizedHeader.includes("site")
        ) {
          mapped.name = row[index];
        } else if (
          normalizedHeader === "actif" ||
          normalizedHeader === "active"
        ) {
          mapped.active = row[index];
        } else if (normalizedHeader.includes("entreprise")) {
          mapped.entrepriseName = row[index];
        }
      });

      return mapped;
    });

    // Valider les données
    const { valid, errors } = await validateSiteUpdateImportData(
      mappedData,
      entrepriseId
    );

    if (errors.length > 0 && valid.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Aucune donnée valide à importer",
          errors,
          summary: {
            total: rows.length,
            created: 0,
            updated: 0,
            errors: errors.length,
            warnings: 0,
          },
        } as SiteUpdateImportResult,
        { status: 400 }
      );
    }

    // Traiter l'importation (modification)
    const importResult = await processSiteUpdateImport(valid, entrepriseId);

    // Combiner les erreurs de validation avec les erreurs d'importation
    const allErrors = [...errors, ...(importResult.errors || [])];

    const summary: ImportSummary = {
      total: rows.length,
      created: 0, // Pas de création dans ce mode
      updated: importResult.summary?.updated || 0,
      errors: allErrors.length,
      warnings: importResult.summary?.warnings || 0,
    };

    const result: SiteUpdateImportResult = {
      success: importResult.success && errors.length === 0,
      message: importResult.message,
      data: importResult.data,
      errors: allErrors,
      summary,
    };

    // Journaliser l'opération d'importation
    try {
      await logImportOperation({
        entrepriseId,
        userId: session!.userId,
        fileName: file.name,
        fileType: file.type,
        totalRecords: rows.length,
        createdRecords: 0,
        updatedRecords: summary.updated,
        errorRecords: summary.errors,
        warningRecords: summary.warnings,
        status: result.success
          ? "SUCCESS"
          : summary.updated > 0
          ? "PARTIAL"
          : "FAILED",
        errorMessage: result.success ? undefined : result.message,
        details: {
          errors: allErrors,
          summary,
        },
      });
    } catch (logError) {
      console.error("Erreur lors de la journalisation:", logError);
      // Ne pas échouer la requête si la journalisation échoue
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur POST /api/sites/update-import:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de la modification des sites",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

async function processSiteUpdateImport(
  validData: any[],
  entrepriseId: string
): Promise<SiteUpdateImportResult> {
  const errors: ImportError[] = [];
  const updated: any[] = [];
  let warnings = 0;

  try {
    // Récupérer les sites existants pour cette entreprise (pour optimisation)
    // Note: On utilise la validation par nom unique [name, entrepriseId] selon le schema.prisma

    for (let i = 0; i < validData.length; i++) {
      const siteData = validData[i];
      const rowNumber = i + 2; // Excel row number

      try {
        // Vérifier si le site existe par nom
        const siteName = siteData.name?.trim();

        if (!siteName) {
          errors.push({
            row: rowNumber,
            field: "name",
            value: siteData.name,
            message: "Le nom du site est obligatoire pour la modification",
            severity: "error",
          });
          continue;
        }

        // Récupérer le site par nom pour cette entreprise
        const existingSite = await prisma.site.findFirst({
          where: {
            name: siteName,
            entrepriseId,
          },
          select: { id: true, name: true },
        });

        if (!existingSite) {
          errors.push({
            row: rowNumber,
            field: "name",
            value: siteName,
            message: "Aucun site trouvé avec ce nom",
            severity: "error",
          });
          continue;
        }

        // Préparer les données de mise à jour
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (siteData.active !== undefined && siteData.active !== null) {
          updateData.active = siteData.active;
        }

        // Mettre à jour le site
        const updatedSite = await prisma.site.update({
          where: { id: existingSite.id },
          data: updateData,
        });

        updated.push(updatedSite);
      } catch (siteError) {
        errors.push({
          row: rowNumber,
          field: "name",
          value: siteData.name,
          message:
            siteError instanceof Error
              ? siteError.message
              : "Erreur lors de la modification du site",
          severity: "error",
        });
      }
    }

    const success = errors.length === 0;
    const message = success
      ? `Modification réussie: ${updated.length} sites mis à jour`
      : `Modification partielle: ${updated.length} sites mis à jour, ${errors.length} erreurs`;

    return {
      success,
      message,
      data: updated,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: validData.length,
        created: 0,
        updated: updated.length,
        errors: errors.length,
        warnings,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Erreur critique lors du traitement de la modification",
      errors: [
        {
          row: 0,
          field: "system",
          value: null,
          message:
            error instanceof Error ? error.message : "Erreur système inconnue",
          severity: "error",
        },
      ],
    };
  }
}

// GET - Télécharger le template Excel pour modification
export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    // Récupérer les sites existants pour le template
    const existingSites = await prisma.site.findMany({
      where: { entrepriseId },
      select: { id: true, name: true, active: true },
      take: 10, // Limiter à 10 sites pour l'exemple
    });

    // Créer le template Excel avec les sites existants
    const templateData = existingSites.map((site, index) => ({
      "Nom du site*": site.name,
      Actif: site.active ? "true" : "false",
      "Entreprise (optionnel)": "",
    }));

    // Si aucun site existant, créer un exemple
    if (templateData.length === 0) {
      templateData.push({
        "Nom du site*": "Site Exemple",
        Actif: "true",
        "Entreprise (optionnel)": "",
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sites Modification");

    // Ajouter des commentaires d'instructions
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:D1");
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;

      const header = worksheet[cellAddress].v;
      let comment = "";

      if (header.includes("Nom du site")) {
        comment = "Obligatoire. Nom existant du site à modifier.";
      } else if (header.includes("Actif")) {
        comment =
          "Optionnel. true/false, oui/non, 1/0. Laissez vide pour ne pas modifier.";
      } else if (header.includes("Entreprise")) {
        comment =
          "Optionnel. À remplir uniquement si vous avez plusieurs entreprises.";
      }

      if (comment) {
        worksheet[cellAddress].c = [
          { t: comment, r: "<r><rPr><b/></rPr><t>" + comment + "</t></r>" },
        ];
      }
    }

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          "attachment; filename=sites_update_template.xlsx",
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/sites/update-import:", error);
    return NextResponse.json(
      { message: "Erreur lors de la génération du template" },
      { status: 500 }
    );
  }
}
