import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";
import * as XLSX from "xlsx";
import { objectifUpdateImportSchema } from "@/lib/validation/objectif-update-import.schema";
import { logImportOperation } from "@/lib/import-logger";

const the_resource = "objectif";

interface ImportError {
  row: number;
  field: string;
  value: any;
  message: string;
  severity: "error" | "warning";
}

interface ImportSummary {
  total: number;
  created: number;
  updated: number;
  errors: number;
  warnings: number;
}

// GET - Template Excel pour la modification
export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    // Récupérer les objectifs existants
    const existingObjectifs = await prisma.objectif.findMany({
      include: {
        parc: { select: { name: true } },
        site: { select: { name: true } },
      },
      orderBy: { annee: "desc" },
      take: 10,
    });

    // Créer le template avec données existantes
    const templateData = existingObjectifs.map((objectif) => ({
      "Année*": objectif.annee,
      "Parc*": objectif.parc?.name || "Parc existant",
      "Site*": objectif.site?.name || "Site existant",
      Dispo: objectif.dispo || "",
      MTBF: objectif.mtbf || "",
      TDM: objectif.tdm || "",
      "Spécification huile": objectif.spe_huile || "",
      "Spécification GO": objectif.spe_go || "",
      "Spécification graisse": objectif.spe_graisse || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Objectifs");

    // Ajouter des commentaires d'instructions
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:I1");
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;

      const header = worksheet[cellAddress].v;
      let comment = "";

      if (header.includes("Année")) {
        comment = "Obligatoire. Année de l'objectif existant.";
      } else if (header.includes("Parc")) {
        comment =
          "Obligatoire. Parc existant. Disponibles: " +
          existingObjectifs
            .map((o) => o.parc?.name)
            .filter(Boolean)
            .join(", ");
      } else if (header.includes("Site")) {
        comment =
          "Obligatoire. Site existant. Disponibles: " +
          existingObjectifs
            .map((o) => o.site?.name)
            .filter(Boolean)
            .join(", ");
      } else if (header.includes("Dispo")) {
        comment = "Optionnel. Nouvelle valeur (si vide, pas de modification).";
      } else if (header.includes("MTBF")) {
        comment = "Optionnel. Nouvelle valeur (si vide, pas de modification).";
      } else if (header.includes("TDM")) {
        comment = "Optionnel. Nouvelle valeur (si vide, pas de modification).";
      } else if (header.includes("huile")) {
        comment = "Optionnel. Nouvelle valeur (si vide, pas de modification).";
      } else if (header.includes("GO")) {
        comment = "Optionnel. Nouvelle valeur (si vide, pas de modification).";
      } else if (header.includes("graisse")) {
        comment = "Optionnel. Nouvelle valeur (si vide, pas de modification).";
      }

      if (comment) {
        worksheet[cellAddress].c = [
          { t: comment, r: "<r><rPr><b/></rPr><t>" + comment + "</t></r>" },
        ];
      }
    }

    worksheet["!cols"] = [
      { wch: 10 }, // Année
      { wch: 20 }, // Parc
      { wch: 20 }, // Site
      { wch: 10 }, // Dispo
      { wch: 10 }, // MTBF
      { wch: 10 }, // TDM
      { wch: 18 }, // Spécification huile
      { wch: 18 }, // Spécification GO
      { wch: 20 }, // Spécification graisse
    ];

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="template-update-objectifs.xlsx"',
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/objectifs/update-import:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du template" },
      { status: 500 }
    );
  }
}

// POST - Modification par importation des objectifs
export async function POST(request: NextRequest) {
  try {
    const protectionError = await protectCreateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { data } = body;

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { message: "Aucune donnée à importer" },
        { status: 400 }
      );
    }

    // Récupérer les données de référence pour le mapping
    const [parcs, sites] = await Promise.all([
      prisma.parc.findMany({
        select: { id: true, name: true },
      }),
      prisma.site.findMany({
        select: { id: true, name: true },
      }),
    ]);

    const parcMap = new Map(parcs.map((p) => [p.name, p.id]));
    const siteMap = new Map(sites.map((s) => [s.name, s.id]));

    const results: any[] = [];
    const errors: ImportError[] = [];
    let updatedCount = 0;

    for (const rowData of data) {
      try {
        // Validation des données
        const validatedData = await objectifUpdateImportSchema.validate(
          rowData,
          {
            abortEarly: false,
          }
        );

        // Mapping des noms vers IDs
        const parcId = parcMap.get(validatedData.parc);
        const siteId = siteMap.get(validatedData.site);

        if (!parcId) {
          errors.push({
            row: data.indexOf(rowData) + 2,
            field: "parc",
            value: validatedData.parc,
            message: `Parc "${validatedData.parc}" non trouvé`,
            severity: "error",
          });
          continue;
        }

        if (!siteId) {
          errors.push({
            row: data.indexOf(rowData) + 2,
            field: "site",
            value: validatedData.site,
            message: `Site "${validatedData.site}" non trouvé`,
            severity: "error",
          });
          continue;
        }

        // Trouver l'objectif existant
        const existing = await prisma.objectif.findUnique({
          where: {
            annee_parcId_siteId: {
              annee: validatedData.annee,
              parcId,
              siteId,
            },
          },
        });

        if (!existing) {
          errors.push({
            row: data.indexOf(rowData) + 2,
            field: "unique",
            value: `${validatedData.annee}-${validatedData.parc}-${validatedData.site}`,
            message:
              "Aucun objectif trouvé pour cette année, ce parc et ce site",
            severity: "error",
          });
          continue;
        }

        // Préparer les données de mise à jour (uniquement les champs fournis)
        const updateData: any = {};

        if (validatedData.dispo !== undefined && validatedData.dispo !== null) {
          updateData.dispo = validatedData.dispo;
        }
        if (validatedData.mtbf !== undefined && validatedData.mtbf !== null) {
          updateData.mtbf = validatedData.mtbf;
        }
        if (validatedData.tdm !== undefined && validatedData.tdm !== null) {
          updateData.tdm = validatedData.tdm;
        }
        if (
          validatedData.spe_huile !== undefined &&
          validatedData.spe_huile !== null
        ) {
          updateData.spe_huile = validatedData.spe_huile;
        }
        if (
          validatedData.spe_go !== undefined &&
          validatedData.spe_go !== null
        ) {
          updateData.spe_go = validatedData.spe_go;
        }
        if (
          validatedData.spe_graisse !== undefined &&
          validatedData.spe_graisse !== null
        ) {
          updateData.spe_graisse = validatedData.spe_graisse;
        }

        // Mettre à jour l'objectif
        const updatedObjectif = await prisma.objectif.update({
          where: { id: existing.id },
          data: updateData,
          include: {
            parc: true,
            site: true,
          },
        });

        results.push(updatedObjectif);
        updatedCount++;
      } catch (error: any) {
        errors.push({
          row: data.indexOf(rowData) + 2,
          field: "general",
          value: rowData,
          message:
            error.errors?.[0]?.message ||
            error.message ||
            "Erreur lors de la validation",
          severity: "error",
        });
      }
    }

    // Journaliser l'opération
    await logImportOperation({
      entrepriseId,
      userId: session?.userId || "",
      fileName: "objectifs_update_import.xlsx",
      fileType: "xlsx",
      totalRecords: data.length,
      createdRecords: 0,
      updatedRecords: updatedCount,
      errorRecords: errors.length,
      warningRecords: 0,
      status: errors.length === 0 ? "SUCCESS" : "PARTIAL",
      errorMessage:
        errors.length > 0 ? `${errors.length} erreurs détectées` : undefined,
    });

    return NextResponse.json({
      success: errors.length === 0,
      message: `${updatedCount} objectif(s) mis à jour(s) avec succès`,
      data: results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: data.length,
        created: 0,
        updated: updatedCount,
        errors: errors.length,
        warnings: 0,
      },
    });
  } catch (error) {
    console.error("Erreur POST /api/objectifs/update-import:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification des objectifs" },
      { status: 500 }
    );
  }
}
