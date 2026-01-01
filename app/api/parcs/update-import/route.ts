import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";
import * as XLSX from "xlsx";
import {
  validateParcUpdateImportData,
  ParcUpdateImportResult,
  ImportError,
  ImportSummary,
} from "@/lib/validation/parc-update-import.schema";
import { logImportOperation } from "@/lib/import-logger";

const the_resource = "parc";

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
          normalizedHeader.includes("parc")
        ) {
          mapped.name = row[index];
        } else if (
          normalizedHeader.includes("type") &&
          normalizedHeader.includes("parc")
        ) {
          mapped.typeparcName = row[index];
        }
      });

      return mapped;
    });

    // Valider les données
    const { valid, errors } = await validateParcUpdateImportData(
      mappedData,
      entrepriseId
    );

    if (errors.length > 0 && valid.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Aucune donnée valide à modifier",
          errors,
          summary: {
            total: rows.length,
            created: 0,
            updated: 0,
            errors: errors.length,
            warnings: 0,
          },
        } as ParcUpdateImportResult,
        { status: 400 }
      );
    }

    // Traiter la modification
    const importResult = await processParcUpdateImport(valid, entrepriseId);

    // Combiner les erreurs de validation avec les erreurs d'importation
    const allErrors = [...errors, ...(importResult.errors || [])];

    const summary: ImportSummary = {
      total: rows.length,
      created: importResult.summary?.created || 0,
      updated: importResult.summary?.updated || 0,
      errors: allErrors.length,
      warnings: importResult.summary?.warnings || 0,
    };

    const result: ParcUpdateImportResult = {
      success: importResult.success && errors.length === 0,
      message: importResult.message,
      data: importResult.data,
      errors: allErrors,
      summary,
    };

    // Journaliser l'opération
    await logImportOperation({
      entrepriseId: entrepriseId,
      userId: session?.userId || "unknown",
      fileName: file.name,
      fileType: "parc-update",
      totalRecords: summary.total,
      createdRecords: 0,
      updatedRecords: summary.updated,
      errorRecords: summary.errors,
      warningRecords: summary.warnings,
      status: result.success ? "SUCCESS" : "PARTIAL",
      details: { summary },
    });

    return NextResponse.json(result, {
      status: result.success ? 200 : 207,
    });
  } catch (error) {
    console.error("Erreur POST /api/parcs/update-import:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification des parcs" },
      { status: 500 }
    );
  }
}

// GET - Fournir un template de modification
export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, "parc");
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    // Récupérer les parcs et types de parcs disponibles
    const parcs = await prisma.parc.findMany({
      where: { entrepriseId },
      select: { name: true },
      take: 5,
    });

    const typeParcs = await prisma.typeparc.findMany({
      where: { entrepriseId },
      select: { name: true },
    });

    // Créer le template Excel
    const templateData = [
      {
        "Nom du parc*": parcs.length > 0 ? parcs[0].name : "Nom parc existant",
        "Type de parc (optionnel)":
          typeParcs.length > 0 ? typeParcs[0].name : "",
      },
      ...(parcs.length > 1
        ? [
            {
              "Nom du parc*": parcs[1].name,
              "Type de parc (optionnel)": "",
            },
          ]
        : []),
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Parcs");

    // Ajouter des commentaires d'instructions
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:B1");
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;

      const header = worksheet[cellAddress].v;
      let comment = "";

      if (header.includes("Nom du parc")) {
        comment =
          "Obligatoire. Nom du parc existant à modifier. Parcs disponibles: " +
          parcs.map((p) => p.name).join(", ");
      } else if (header.includes("Type de parc")) {
        comment =
          "Optionnel. Nouveau type de parc (si vide, pas de modification). Types disponibles: " +
          typeParcs.map((t) => t.name).join(", ");
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
          "attachment; filename=parcs_update_template.xlsx",
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/parcs/update-import:", error);
    return NextResponse.json(
      { message: "Erreur lors de la génération du template" },
      { status: 500 }
    );
  }
}

async function processParcUpdateImport(
  validData: any[],
  entrepriseId: string
): Promise<{
  success: boolean;
  message: string;
  data?: any[];
  errors?: ImportError[];
  summary?: ImportSummary;
}> {
  const results: any[] = [];
  const errors: ImportError[] = [];
  let updatedCount = 0;

  for (const parcData of validData) {
    try {
      // Mettre à jour le parc
      const updateData: any = {};
      if (parcData.typeparcId) {
        updateData.typeparcId = parcData.typeparcId;
      }

      const updatedParc = await prisma.parc.update({
        where: { id: parcData.parcId },
        data: updateData,
        include: {
          typeparc: true,
        },
      });

      results.push(updatedParc);
      updatedCount++;
    } catch (error) {
      errors.push({
        row: validData.indexOf(parcData) + 2,
        field: "general",
        value: parcData,
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de la mise à jour",
        severity: "error",
      });
    }
  }

  return {
    success: errors.length === 0,
    message: `${updatedCount} parc(s) mis à jour avec succès`,
    data: results,
    errors: errors.length > 0 ? errors : undefined,
    summary: {
      total: validData.length,
      created: 0,
      updated: updatedCount,
      errors: errors.length,
      warnings: 0,
    },
  };
}
