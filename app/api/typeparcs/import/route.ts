import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";
import * as XLSX from "xlsx";
import {
  validateTypeparcImportData,
  TypeparcImportResult,
  ImportError,
  ImportSummary,
} from "@/lib/validation/typeparc-import.schema";
import { logImportOperation } from "@/lib/import-logger";

const the_resource = "typeparc";

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
          normalizedHeader.includes("type") &&
          normalizedHeader.includes("parc")
        ) {
          mapped.name = row[index];
        }
      });

      return mapped;
    });

    // Valider les données
    const validationResult = await validateTypeparcImportData(mappedData);

    if (!validationResult.success) {
      return NextResponse.json(validationResult, { status: 400 });
    }

    // Traiter l'importation
    const result: TypeparcImportResult = {
      success: true,
      message: "Importation terminée",
      data: [],
      errors: [],
      summary: {
        total: validationResult.data!.length,
        created: 0,
        updated: 0,
        errors: 0,
        warnings: 0,
      },
    };

    // Traiter chaque ligne
    for (let i = 0; i < validationResult.data!.length; i++) {
      const item = validationResult.data![i];
      const rowIndex = i + 2; // +2 car on commence à la ligne 2 (0-indexed + header)

      try {
        // Vérifier si le type de parc existe déjà
        const existingTypeparc = await prisma.typeparc.findFirst({
          where: {
            name: item.name,
            entrepriseId,
          },
        });

        if (existingTypeparc) {
          result.errors!.push({
            row: rowIndex,
            field: "name",
            value: item.name,
            message: `Le type de parc "${item.name}" existe déjà`,
            severity: "error",
          });
          result.summary!.errors++;
          continue;
        }

        // Créer le type de parc
        const newTypeparc = await prisma.typeparc.create({
          data: {
            name: item.name,
            entrepriseId,
          },
        });

        result.data!.push(newTypeparc);
        result.summary!.created++;
      } catch (error: any) {
        result.errors!.push({
          row: rowIndex,
          field: "general",
          value: item,
          message: error.message || "Erreur lors de la création",
          severity: "error",
        });
        result.summary!.errors++;
      }
    }

    // Logger l'opération d'importation
    await logImportOperation({
      userId: session.userId,
      entrepriseId,
      resourceType: the_resource,
      operation: "import",
      fileName: file.name,
      summary: result.summary!,
      errors: result.errors!,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Erreur POST /api/typeparcs/import:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'importation" },
      { status: 500 }
    );
  }
}

// GET - Générer un template Excel
export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    // Créer un workbook avec les colonnes attendues
    const workbook = XLSX.utils.book_new();

    // Données d'exemple
    const templateData = [
      ["Nom du type de parc"],
      ["Type A"],
      ["Type B"],
      ["Type C"],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(templateData);

    // Définir la largeur des colonnes
    worksheet["!cols"] = [{ wch: 30 }];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Types de parc");

    // Générer le buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Retourner le fichier
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="template-types-parc.xlsx"',
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/typeparcs/import:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du template" },
      { status: 500 }
    );
  }
}
