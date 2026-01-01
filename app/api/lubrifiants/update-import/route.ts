import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";
import * as XLSX from "xlsx";
import {
  validateLubrifiantUpdateImportData,
  LubrifiantUpdateImportResult,
  ImportError,
  ImportSummary,
} from "@/lib/validation/lubrifiant-update-import.schema";
import { logImportOperation } from "@/lib/import-logger";

const the_resource = "lubrifiant";

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
          normalizedHeader.includes("nouveau") &&
          normalizedHeader.includes("nom")
        ) {
          mapped.newName = row[index];
        } else if (
          normalizedHeader.includes("type") &&
          normalizedHeader.includes("lubrifiant")
        ) {
          mapped.typelubrifiantName = row[index];
        }
      });

      return mapped;
    });

    // Valider les données
    const { valid, errors } = await validateLubrifiantUpdateImportData(
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
    const typeLubrifiants = await prisma.typelubrifiant.findMany({
      where: { entrepriseId },
      select: { id: true, name: true },
    });

    // Créer une map pour le mapping rapide
    const typeLubrifiantMap = new Map(
      typeLubrifiants.map((t) => [t.name.toLowerCase(), t.id])
    );

    // Traiter la mise à jour
    const summary: ImportSummary = {
      total: valid.length,
      created: 0,
      updated: 0,
      errors: errors.length,
      warnings: 0,
    };

    const importErrors: ImportError[] = [...errors];
    const updatedRecords: any[] = [];

    for (const item of valid) {
      try {
        // Trouver le lubrifiant existant
        const existing = await prisma.lubrifiant.findFirst({
          where: {
            name: item.name,
            entrepriseId,
          },
        });

        if (!existing) {
          importErrors.push({
            row: 0,
            field: "name",
            value: item.name,
            message: `Le lubrifiant "${item.name}" n'existe pas`,
            severity: "error",
          });
          summary.errors++;
        } else {
          // Préparer les données de mise à jour
          const updateData: any = {};

          if (item.newName && item.newName !== existing.name) {
            updateData.name = item.newName;
          }

          if (item.typelubrifiantName) {
            const typelubrifiantId = typeLubrifiantMap.get(
              item.typelubrifiantName.toLowerCase()
            );
            if (!typelubrifiantId) {
              importErrors.push({
                row: 0,
                field: "typelubrifiantName",
                value: item.typelubrifiantName,
                message: `Le type de lubrifiant "${item.typelubrifiantName}" n'existe pas`,
                severity: "error",
              });
              summary.errors++;
              continue;
            }
            updateData.typelubrifiantId = typelubrifiantId;
          }

          // Mettre à jour seulement s'il y a des changements
          if (Object.keys(updateData).length > 0) {
            const updated = await prisma.lubrifiant.update({
              where: { id: existing.id },
              data: updateData,
            });

            updatedRecords.push(updated);
            summary.updated++;
          } else {
            // Aucun changement nécessaire
            updatedRecords.push(existing);
            summary.updated++;
          }
        }
      } catch (error) {
        importErrors.push({
          row: 0,
          field: "general",
          value: item.name,
          message: `Erreur lors de la mise à jour: ${
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
          : summary.updated > 0
          ? "PARTIAL"
          : "FAILED",
      errorMessage:
        summary.errors > 0
          ? `${summary.errors} erreurs rencontrées`
          : undefined,
      details: JSON.stringify({
        updatedRecords: updatedRecords.map((r) => ({
          id: r.id,
          name: r.name,
          type: r.typelubrifiantId,
        })),
        errors: importErrors,
      }),
    });

    const result: LubrifiantUpdateImportResult = {
      success: summary.errors === 0,
      message:
        summary.errors === 0
          ? `${summary.updated} lubrifiants mis à jour avec succès`
          : `${summary.updated} mis à jour, ${summary.errors} erreurs`,
      data: updatedRecords,
      errors: importErrors,
      summary,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur lors de la mise à jour des lubrifiants:", error);
    return NextResponse.json(
      {
        message: "Erreur serveur lors de la mise à jour",
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

    // Récupérer les lubrifiants existants avec leurs relations
    const existingLubrifiants = await prisma.lubrifiant.findMany({
      where: { entrepriseId },
      select: {
        id: true,
        name: true,
        typelubrifiant: { select: { name: true } },
      },
      take: 5,
    });

    // Récupérer les données de référence
    const typeLubrifiants = await prisma.typelubrifiant.findMany({
      where: { entrepriseId },
      select: { name: true },
    });

    // Créer le template avec données existantes
    const templateData = existingLubrifiants.map((lubrifiant, index) => ({
      "Nom*": lubrifiant.name,
      "Nouveau nom": index === 0 ? "Nouveau nom exemple" : "",
      "Type lubrifiant":
        index === 0
          ? typeLubrifiants.length > 1
            ? typeLubrifiants[1].name
            : ""
          : "",
    }));

    // Si aucune donnée existante, créer un exemple
    if (templateData.length === 0) {
      templateData.push({
        "Nom*": "Lubrifiant existant",
        "Nouveau nom": "Nouveau nom modifié",
        "Type lubrifiant":
          typeLubrifiants.length > 0 ? typeLubrifiants[0].name : "Type Exemple",
      });
    }

    // Créer le workbook et la feuille
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Lubrifiants");

    // Ajouter des commentaires sur les en-têtes
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:C1");
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;

      const header = worksheet[cellAddress].v;
      let comment = "";

      if (header.includes("Nom*")) {
        comment =
          "Obligatoire. Lubrifiant existant à modifier. Disponibles: " +
          existingLubrifiants.map((l) => l.name).join(", ");
      } else if (header.includes("Nouveau nom")) {
        comment = "Optionnel. Nouveau nom (si vide, pas de modification).";
      } else if (header.includes("Type lubrifiant")) {
        comment =
          "Optionnel. Nouveau type de lubrifiant. Disponibles: " +
          typeLubrifiants.map((t) => t.name).join(", ");
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
          "attachment; filename=lubrifiants_update_template.xlsx",
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/lubrifiants/update-import:", error);
    return NextResponse.json(
      { message: "Erreur lors de la génération du template" },
      { status: 500 }
    );
  }
}
