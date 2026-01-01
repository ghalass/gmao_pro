import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";
import * as XLSX from "xlsx";
import {
  validateTypelubrifiantUpdateImportData,
  TypelubrifiantUpdateImportResult,
  ImportError,
  ImportSummary,
} from "@/lib/validation/typelubrifiant-update-import.schema";
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
    const { valid, errors } = await validateTypelubrifiantUpdateImportData(
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
        } as TypelubrifiantUpdateImportResult,
        { status: 400 }
      );
    }

    // Traiter l'importation
    const importResult = await processTypelubrifiantUpdateImport(
      valid,
      entrepriseId
    );

    // Combiner les erreurs de validation avec les erreurs d'importation
    const allErrors = [...errors, ...(importResult.errors || [])];

    const summary: ImportSummary = {
      total: rows.length,
      created: importResult.summary?.created || 0,
      updated: importResult.summary?.updated || 0,
      errors: allErrors.length,
      warnings: importResult.summary?.warnings || 0,
    };

    const result: TypelubrifiantUpdateImportResult = {
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
    console.error("Erreur POST /api/typelubrifiants/update-import:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de la modification des types de lubrifiants",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

async function processTypelubrifiantUpdateImport(
  validData: any[],
  entrepriseId: string
): Promise<TypelubrifiantUpdateImportResult> {
  const errors: ImportError[] = [];
  const updated: any[] = [];

  try {
    for (let i = 0; i < validData.length; i++) {
      const typelubrifiantData = validData[i];
      const rowNumber = i + 2; // Excel row number

      try {
        // Mettre à jour le type de lubrifiant existant
        const updatedTypelubrifiant = await prisma.typelubrifiant.update({
          where: { id: typelubrifiantData.typelubrifiantId },
          data: {
            updatedAt: new Date(),
          },
        });

        updated.push(updatedTypelubrifiant);
      } catch (typelubrifiantError) {
        errors.push({
          row: rowNumber,
          field: "general",
          value: typelubrifiantData.name,
          message:
            typelubrifiantError instanceof Error
              ? typelubrifiantError.message
              : "Erreur lors de la mise à jour du type de lubrifiant",
          severity: "error",
        });
      }
    }

    const success = errors.length === 0;
    const message = success
      ? `Modification réussie: ${updated.length} types de lubrifiants mis à jour`
      : `Modification partielle: ${updated.length} mis à jour, ${errors.length} erreurs`;

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
        warnings: 0,
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

// GET - Télécharger le template Excel de mise à jour
export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, _resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    // Récupérer les types de lubrifiants existants
    const existingTypelubrifiants = await prisma.typelubrifiant.findMany({
      where: { entrepriseId },
      select: { name: true },
      take: 5,
    });

    // Créer le template avec données existantes
    const templateData = [
      {
        "Nom du type de lubrifiant*":
          existingTypelubrifiants.length > 0
            ? existingTypelubrifiants[0].name
            : "Huile Moteur",
      },
      ...(existingTypelubrifiants.length > 1
        ? [
            {
              "Nom du type de lubrifiant*": existingTypelubrifiants[1].name,
            },
          ]
        : []),
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Types de Lubrifiants");

    // Ajouter les commentaires
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:A1");
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;

      const header = worksheet[cellAddress].v;
      let comment = "";

      if (header.includes("Nom du type de lubrifiant")) {
        comment =
          "Obligatoire. Type de lubrifiant existant à modifier. Disponibles: " +
          existingTypelubrifiants.map((t) => t.name).join(", ");
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
          "attachment; filename=typelubrifiants_update_template.xlsx",
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/typelubrifiants/update-import:", error);
    return NextResponse.json(
      { message: "Erreur lors de la génération du template" },
      { status: 500 }
    );
  }
}
