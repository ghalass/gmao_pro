import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";
import * as XLSX from "xlsx";
import {
  validateTypeconsommationlubImportData,
  TypeconsommationlubImportResult,
  ImportError,
  ImportSummary,
} from "@/lib/validation/typeconsommationlub-import.schema";
import { logImportOperation } from "@/lib/import-logger";

const the_resource = "typeconsommationlub";

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
        if (normalizedHeader.includes("nom")) {
          mapped.name = row[index];
        }
      });

      return mapped;
    });

    // Valider les données
    const { valid, errors } = await validateTypeconsommationlubImportData(
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
        // Vérifier si le type de consommation de lubrifiant existe déjà
        const existing = await prisma.typeconsommationlub.findFirst({
          where: {
            name: item.name,
            entrepriseId,
          },
        });

        if (existing) {
          importErrors.push({
            row: 0, // We don't track row numbers here
            field: "name",
            value: item.name,
            message: `Le type de consommation de lubrifiant "${item.name}" existe déjà`,
            severity: "error",
          });
          summary.errors++;
        } else {
          // Créer le nouveau type de consommation de lubrifiant
          const created = await prisma.typeconsommationlub.create({
            data: {
              name: item.name,
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

    const result: TypeconsommationlubImportResult = {
      success: summary.errors === 0,
      message:
        summary.errors === 0
          ? `${summary.created} types de consommation de lubrifiants créés avec succès`
          : `${summary.created} créés, ${summary.errors} erreurs`,
      data: createdRecords,
      errors: importErrors,
      summary,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "Erreur lors de l'importation des types de consommation de lubrifiants:",
      error
    );
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

    // Créer les données du template avec exemples
    const templateData = [
      {
        "Nom du type*": "Huile Moteur",
      },
      {
        "Nom du type*": "Graissage",
      },
    ];

    // Créer le workbook et la feuille
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "TypesConsommationLubs");

    // Ajouter des commentaires sur les en-têtes
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:A1");
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;

      const header = worksheet[cellAddress].v;
      let comment = "";

      if (header.includes("Nom du type")) {
        comment =
          "Obligatoire. Nom unique du type de consommation de lubrifiant.";
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
        "Content-Disposition":
          "attachment; filename=typeconsommationlubs_template.xlsx",
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/typeconsommationlubs/import:", error);
    return NextResponse.json(
      { message: "Erreur lors de la génération du template" },
      { status: 500 }
    );
  }
}
