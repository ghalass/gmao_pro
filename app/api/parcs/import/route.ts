import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";
import * as XLSX from "xlsx";
import {
  validateParcImportData,
  ParcImportResult,
  ImportError,
  ImportSummary,
} from "@/lib/validation/parc-import.schema";
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
    const { valid, errors } = await validateParcImportData(
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
        } as ParcImportResult,
        { status: 400 }
      );
    }

    // Traiter l'importation
    const importResult = await processParcImport(valid, entrepriseId);

    // Combiner les erreurs de validation avec les erreurs d'importation
    const allErrors = [...errors, ...(importResult.errors || [])];

    const summary: ImportSummary = {
      total: rows.length,
      created: importResult.summary?.created || 0,
      updated: importResult.summary?.updated || 0,
      errors: allErrors.length,
      warnings: importResult.summary?.warnings || 0,
    };

    const result: ParcImportResult = {
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
      fileType: "parc",
      totalRecords: summary.total,
      createdRecords: summary.created,
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
    console.error("Erreur POST /api/parcs/import:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'importation des parcs" },
      { status: 500 }
    );
  }
}

// GET - Fournir un template d'importation
export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, "parc");
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    // Récupérer les types de parcs disponibles pour le template
    const typeParcs = await prisma.typeparc.findMany({
      where: { entrepriseId },
      select: { name: true },
    });

    // Créer le template Excel
    const templateData = [
      {
        "Nom du parc*":
          typeParcs.length > 0 ? "Parc Exemple 1" : "Parc Principal",
        "Type de parc*": typeParcs.length > 0 ? typeParcs[0].name : "Type1",
      },
      {
        "Nom du parc*":
          typeParcs.length > 0 ? "Parc Exemple 2" : "Parc Secondaire",
        "Type de parc*": typeParcs.length > 0 ? typeParcs[0].name : "Type2",
      },
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
        comment = "Obligatoire. Nom unique du parc.";
      } else if (header.includes("Type de parc")) {
        comment =
          "Obligatoire. Doit correspondre à un type de parc existant. Types disponibles: " +
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
        "Content-Disposition": "attachment; filename=parcs_template.xlsx",
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/parcs/import:", error);
    return NextResponse.json(
      { message: "Erreur lors de la génération du template" },
      { status: 500 }
    );
  }
}

async function processParcImport(
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
  let createdCount = 0;

  for (const parcData of validData) {
    try {
      // Vérifier si le parc existe déjà
      const existing = await prisma.parc.findFirst({
        where: {
          name: parcData.name,
          entrepriseId,
        },
      });

      if (existing) {
        errors.push({
          row: validData.indexOf(parcData) + 2,
          field: "name",
          value: parcData.name,
          message: `Un parc avec ce nom existe déjà`,
          severity: "error",
        });
        continue;
      }

      // Créer le parc
      const newParc = await prisma.parc.create({
        data: {
          name: parcData.name,
          typeparcId: parcData.typeparcId,
          entrepriseId,
        },
        include: {
          typeparc: true,
        },
      });

      results.push(newParc);
      createdCount++;
    } catch (error) {
      errors.push({
        row: validData.indexOf(parcData) + 2,
        field: "general",
        value: parcData,
        message:
          error instanceof Error ? error.message : "Erreur lors de la création",
        severity: "error",
      });
    }
  }

  return {
    success: errors.length === 0,
    message: `${createdCount} parc(s) créé(s) avec succès`,
    data: results,
    errors: errors.length > 0 ? errors : undefined,
    summary: {
      total: validData.length,
      created: createdCount,
      updated: 0,
      errors: errors.length,
      warnings: 0,
    },
  };
}
