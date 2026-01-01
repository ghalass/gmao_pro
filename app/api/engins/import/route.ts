import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";
import * as XLSX from "xlsx";
import {
  validateEnginImportData,
  EnginImportResult,
  ImportError,
  ImportSummary,
} from "@/lib/validation/engin-import.schema";
import { logImportOperation } from "@/lib/import-logger";

const the_resource = "engin";

export async function POST(request: NextRequest) {
  try {
    const protectionError = await protectCreateRoute(request, the_resource);
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
          !normalizedHeader.includes("nouveau")
        ) {
          mapped.name = row[index];
        } else if (
          normalizedHeader === "actif" ||
          normalizedHeader === "active"
        ) {
          mapped.active = row[index];
        } else if (normalizedHeader.includes("parc")) {
          mapped.parcName = row[index];
        } else if (normalizedHeader.includes("site")) {
          mapped.siteName = row[index];
        } else if (
          normalizedHeader.includes("heure") &&
          normalizedHeader.includes("chassis")
        ) {
          mapped.initialHeureChassis = row[index];
        }
      });

      return mapped;
    });

    // Valider les données
    const { valid, errors } = await validateEnginImportData(
      mappedData,
      entrepriseId
    );

    if (errors.length > 0 && valid.length === 0) {
      return NextResponse.json(
        {
          message: "Erreurs de validation trouvées",
          errors,
        },
        { status: 400 }
      );
    }

    // Récupérer les données de référence pour le mapping
    const parcs = await prisma.parc.findMany({
      where: { entrepriseId },
      select: { id: true, name: true },
    });

    const sites = await prisma.site.findMany({
      where: { entrepriseId },
      select: { id: true, name: true },
    });

    // Créer des maps pour le mapping rapide
    const parcMap = new Map(parcs.map((p) => [p.name.toLowerCase(), p.id]));
    const siteMap = new Map(sites.map((s) => [s.name.toLowerCase(), s.id]));

    // Traiter l'importation
    const summary: ImportSummary = {
      total: valid.length,
      created: 0,
      updated: 0,
      errors: errors.length,
      warnings: 0,
    };

    const importErrors: ImportError[] = [...errors];
    const createdRecords: any[] = [];

    for (const item of valid) {
      try {
        // Vérifier si l'engin existe déjà
        const existing = await prisma.engin.findFirst({
          where: {
            name: item.name,
            entrepriseId,
          },
        });

        if (existing) {
          importErrors.push({
            row: 0,
            field: "name",
            value: item.name,
            message: `L'engin "${item.name}" existe déjà`,
            severity: "error",
          });
          summary.errors++;
        } else {
          // Mapper les noms vers les IDs
          const parcId = item.parcName
            ? parcMap.get(item.parcName.toLowerCase())
            : null;
          const siteId = item.siteName
            ? siteMap.get(item.siteName.toLowerCase())
            : null;

          if (!parcId) {
            importErrors.push({
              row: 0,
              field: "parcName",
              value: item.parcName,
              message: `Le parc "${item.parcName}" n'existe pas`,
              severity: "error",
            });
            summary.errors++;
            continue;
          }

          if (!siteId) {
            importErrors.push({
              row: 0,
              field: "siteName",
              value: item.siteName,
              message: `Le site "${item.siteName}" n'existe pas`,
              severity: "error",
            });
            summary.errors++;
            continue;
          }

          // Créer le nouvel engin
          const created = await prisma.engin.create({
            data: {
              name: item.name,
              active: item.active ?? true,
              parcId,
              siteId,
              initialHeureChassis: item.initialHeureChassis ?? 0,
              entrepriseId,
            },
          });

          createdRecords.push(created);
          summary.created++;
        }
      } catch (error) {
        importErrors.push({
          row: 0,
          field: "general",
          value: item.name,
          message: `Erreur lors de la création: ${
            error instanceof Error ? error.message : "Erreur inconnue"
          }`,
          severity: "error",
        });
        summary.errors++;
      }
    }

    // Logger l'opération d'importation
    await logImportOperation({
      entrepriseId,
      userId: session?.userId || "",
      fileName: file.name,
      fileType: file.type,
      totalRecords: summary.total,
      createdRecords: summary.created,
      updatedRecords: summary.updated,
      errorRecords: summary.errors,
      warningRecords: summary.warnings,
      status:
        summary.errors === 0
          ? "SUCCESS"
          : summary.created > 0
          ? "PARTIAL"
          : "FAILED",
      errorMessage:
        summary.errors > 0
          ? `${summary.errors} erreurs rencontrées`
          : undefined,
      details: JSON.stringify({
        createdRecords: createdRecords.map((r) => ({ id: r.id, name: r.name })),
        errors: importErrors,
      }),
    });

    const result: EnginImportResult = {
      success: summary.errors === 0,
      message:
        summary.errors === 0
          ? `${summary.created} engins créés avec succès`
          : `${summary.created} créés, ${summary.errors} erreurs`,
      data: createdRecords,
      errors: importErrors,
      summary,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur lors de l'importation des engins:", error);
    return NextResponse.json(
      {
        message: "Erreur serveur lors de l'importation",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    // Récupérer les données de référence
    const parcs = await prisma.parc.findMany({
      where: { entrepriseId },
      select: { name: true },
      take: 5,
    });

    const sites = await prisma.site.findMany({
      where: { entrepriseId },
      select: { name: true },
      take: 5,
    });

    // Créer les données du template avec exemples réels
    const templateData = [
      {
        "Nom*": "Engin Exemple 1",
        Actif: "true",
        "Parc*": parcs.length > 0 ? parcs[0].name : "Parc Exemple",
        "Site*": sites.length > 0 ? sites[0].name : "Site Exemple",
        "Heure chassis initiale": "1000.5",
      },
      {
        "Nom*": "Engin Exemple 2",
        Actif: "false",
        "Parc*": parcs.length > 0 ? parcs[0].name : "Parc Exemple",
        "Site*": sites.length > 0 ? sites[0].name : "Site Exemple",
        "Heure chassis initiale": "",
      },
    ];

    // Créer le workbook et la feuille
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Engins");

    // Ajouter des commentaires sur les en-têtes
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:E1");
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;

      const header = worksheet[cellAddress].v;
      let comment = "";

      if (header.includes("Nom")) {
        comment = "Obligatoire. Nom unique de l'engin.";
      } else if (header.includes("Actif")) {
        comment = "Optionnel. Statut de l'engin (true/false, oui/non, 1/0).";
      } else if (header.includes("Parc")) {
        comment =
          "Obligatoire. Nom du parc associé. Disponibles: " +
          parcs.map((p) => p.name).join(", ");
      } else if (header.includes("Site")) {
        comment =
          "Obligatoire. Nom du site associé. Disponibles: " +
          sites.map((s) => s.name).join(", ");
      } else if (header.includes("Heure chassis")) {
        comment = "Optionnel. Heure chassis initiale (nombre décimal).";
      }

      if (comment) {
        worksheet[cellAddress].c = [
          { t: comment, r: "<r><rPr><b/></rPr><t>" + comment + "</t></r>" },
        ];
      }
    }

    // Générer le fichier binaire XLSX
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Retourner en tant que fichier XLSX binaire avec les bons headers
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=engins_template.xlsx",
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/engins/import:", error);
    return NextResponse.json(
      { message: "Erreur lors de la génération du template" },
      { status: 500 }
    );
  }
}
