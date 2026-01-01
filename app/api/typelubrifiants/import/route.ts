import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";
import * as XLSX from "xlsx";
import {
  validateTypelubrifiantImportData,
  TypelubrifiantImportResult,
  ImportError,
  ImportSummary,
} from "@/lib/validation/typelubrifiant-import.schema";
import { logImportOperation } from "@/lib/import-logger";

const _resource = "typelubrifiant";

export async function POST(request: NextRequest) {
  try {
    const protectionError = await protectCreateRoute(request, _resource);
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
          (normalizedHeader.includes("type") ||
            normalizedHeader.includes("lubrifiant"))
        ) {
          mapped.name = row[index];
        }
      });

      return mapped;
    });

    // Valider les données
    const { valid, errors } = await validateTypelubrifiantImportData(
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
        } as TypelubrifiantImportResult,
        { status: 400 }
      );
    }

    // Traiter l'importation
    const importResult = await processTypelubrifiantImport(valid, entrepriseId);

    // Combiner les erreurs de validation avec les erreurs d'importation
    const allErrors = [...errors, ...(importResult.errors || [])];

    const summary: ImportSummary = {
      total: rows.length,
      created: importResult.summary?.created || 0,
      updated: importResult.summary?.updated || 0,
      errors: allErrors.length,
      warnings: importResult.summary?.warnings || 0,
    };

    const result: TypelubrifiantImportResult = {
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
        createdRecords: summary.created,
        updatedRecords: summary.updated,
        errorRecords: summary.errors,
        warningRecords: summary.warnings,
        status: result.success
          ? "SUCCESS"
          : summary.created > 0 || summary.updated > 0
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
    console.error("Erreur POST /api/typelubrifiants/import:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de l'importation des types de lubrifiants",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

async function processTypelubrifiantImport(
  validData: any[],
  entrepriseId: string
): Promise<TypelubrifiantImportResult> {
  const errors: ImportError[] = [];
  const created: any[] = [];
  const updated: any[] = [];
  let warnings = 0;

  try {
    // Récupérer les types de lubrifiants existants pour cette entreprise
    const existingTypelubrifiants = await prisma.typelubrifiant.findMany({
      where: { entrepriseId },
      select: { id: true, name: true },
    });

    const existingTypelubrifiantNames = new Set(
      existingTypelubrifiants.map((typelubrifiant) =>
        typelubrifiant.name.toLowerCase()
      )
    );

    for (let i = 0; i < validData.length; i++) {
      const typelubrifiantData = validData[i];
      const rowNumber = i + 2; // Excel row number

      try {
        // Vérifier si le type de lubrifiant existe déjà
        const typelubrifiantName = typelubrifiantData.name.trim();
        const exists = existingTypelubrifiantNames.has(
          typelubrifiantName.toLowerCase()
        );

        if (exists) {
          // Mise à jour du type de lubrifiant existant
          const existingTypelubrifiant = existingTypelubrifiants.find(
            (t) => t.name.toLowerCase() === typelubrifiantName.toLowerCase()
          );

          const updatedTypelubrifiant = await prisma.typelubrifiant.update({
            where: { id: existingTypelubrifiant!.id },
            data: {
              updatedAt: new Date(),
            },
          });

          updated.push(updatedTypelubrifiant);
          warnings++; // Considérer les mises à jour comme des avertissements
        } else {
          // Création d'un nouveau type de lubrifiant
          const newTypelubrifiant = await prisma.typelubrifiant.create({
            data: {
              name: typelubrifiantName,
              entrepriseId,
            },
          });

          created.push(newTypelubrifiant);
        }
      } catch (typelubrifiantError) {
        errors.push({
          row: rowNumber,
          field: "general",
          value: typelubrifiantData.name,
          message:
            typelubrifiantError instanceof Error
              ? typelubrifiantError.message
              : "Erreur lors du traitement du type de lubrifiant",
          severity: "error",
        });
      }
    }

    const success = errors.length === 0;
    const message = success
      ? `Importation réussie: ${created.length} créés, ${updated.length} mis à jour`
      : `Importation partielle: ${created.length} créés, ${updated.length} mis à jour, ${errors.length} erreurs`;

    return {
      success,
      message,
      data: [...created, ...updated],
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: validData.length,
        created: created.length,
        updated: updated.length,
        errors: errors.length,
        warnings,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Erreur critique lors du traitement de l'importation",
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

// GET - Télécharger le template Excel
export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, _resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    // Créer le template Excel
    const templateData = [
      {
        "Nom du type de lubrifiant*": "Huile Moteur",
      },
      {
        "Nom du type de lubrifiant*": "Graisse",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Types de Lubrifiants");

    // Ajouter des commentaires d'instructions
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:A1");
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;

      const header = worksheet[cellAddress].v;
      let comment = "";

      if (header.includes("Nom du type de lubrifiant")) {
        comment = "Obligatoire. Nom unique du type de lubrifiant.";
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
          "attachment; filename=typelubrifiants_template.xlsx",
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/typelubrifiants/import:", error);
    return NextResponse.json(
      { message: "Erreur lors de la génération du template" },
      { status: 500 }
    );
  }
}
