import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";
import * as XLSX from "xlsx";
import {
  validatePanneImportData,
  PanneImportResult,
  ImportError,
  ImportSummary,
} from "@/lib/validation/panne-import.schema";
import { logImportOperation } from "@/lib/import-logger";

const the_resource = "panne";

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
          !normalizedHeader.includes("type") &&
          !normalizedHeader.includes("nouveau")
        ) {
          mapped.name = row[index];
        } else if (
          normalizedHeader.includes("type") &&
          normalizedHeader.includes("panne")
        ) {
          mapped.typepanneName = row[index];
        } else if (normalizedHeader.includes("description")) {
          mapped.description = row[index];
        }
      });

      return mapped;
    });

    // Valider les données
    const { valid, errors } = await validatePanneImportData(
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
    const typepannes = await prisma.typepanne.findMany({
      where: { entrepriseId },
      select: { id: true, name: true },
    });

    // Créer une map pour le mapping rapide
    const typepanneMap = new Map(
      typepannes.map((t) => [t.name.toLowerCase(), t.id])
    );

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
        // Mapper le nom du type de panne vers l'ID
        const typepanneId = item.typepanneName
          ? typepanneMap.get(item.typepanneName.toLowerCase())
          : null;

        if (!typepanneId) {
          importErrors.push({
            row: 0,
            field: "typepanneName",
            value: item.typepanneName,
            message: `Le type de panne "${item.typepanneName}" n'existe pas`,
            severity: "error",
          });
          summary.errors++;
          continue;
        }

        // Vérifier si la panne existe déjà
        const existing = await prisma.panne.findFirst({
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
            message: `La panne "${item.name}" existe déjà`,
            severity: "error",
          });
          summary.errors++;
        } else {
          // Créer la nouvelle panne
          const created = await prisma.panne.create({
            data: {
              name: item.name,
              typepanneId,
              description: item.description,
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
        createdRecords: createdRecords.map((r) => ({
          id: r.id,
          name: r.name,
          type: r.typepanneId,
        })),
        errors: importErrors,
      }),
    });

    const result: PanneImportResult = {
      success: summary.errors === 0,
      message:
        summary.errors === 0
          ? `${summary.created} pannes créées avec succès`
          : `${summary.created} créées, ${summary.errors} erreurs`,
      data: createdRecords,
      errors: importErrors,
      summary,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur lors de l'importation des pannes:", error);
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
    const typepannes = await prisma.typepanne.findMany({
      where: { entrepriseId },
      select: { name: true },
      take: 5,
    });

    // Créer les données du template avec exemples réels
    const templateData = [
      {
        "Nom*": "Panne Exemple 1",
        "Type panne*":
          typepannes.length > 0 ? typepannes[0].name : "Type Exemple",
        Description: "Description exemple",
      },
      {
        "Nom*": "Panne Exemple 2",
        "Type panne*":
          typepannes.length > 0 ? typepannes[0].name : "Type Exemple",
        Description: "",
      },
    ];

    // Créer le workbook et la feuille
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pannes");

    // Ajouter des commentaires sur les en-têtes
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:C1");
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;

      const header = worksheet[cellAddress].v;
      let comment = "";

      if (header.includes("Nom*")) {
        comment = "Obligatoire. Nom unique de la panne.";
      } else if (header.includes("Type panne*")) {
        comment =
          "Obligatoire. Type de panne associé. Disponibles: " +
          typepannes.map((t) => t.name).join(", ");
      } else if (header.includes("Description")) {
        comment = "Optionnel. Description de la panne.";
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
        "Content-Disposition": "attachment; filename=pannes_template.xlsx",
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/pannes/import:", error);
    return NextResponse.json(
      { message: "Erreur lors de la génération du template" },
      { status: 500 }
    );
  }
}
