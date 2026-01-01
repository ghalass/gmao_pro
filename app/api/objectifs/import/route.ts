import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";
import * as XLSX from "xlsx";
import { objectifImportSchema } from "@/lib/validation/objectif-import.schema";
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

// GET - Template Excel pour l'importation
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
    const [parcs, sites] = await Promise.all([
      prisma.parc.findMany({
        select: { name: true },
        orderBy: { name: "asc" },
        take: 10,
      }),
      prisma.site.findMany({
        select: { name: true },
        orderBy: { name: "asc" },
        take: 10,
      }),
    ]);

    // Créer les données du template avec exemples réels
    const templateData = [
      {
        "Année*": new Date().getFullYear(),
        "Parc*": parcs.length > 0 ? parcs[0].name : "Parc Exemple",
        "Site*": sites.length > 0 ? sites[0].name : "Site Exemple",
        Dispo: 95,
        MTBF: 8760,
        TDM: 5,
        "Spécification huile": 500,
        "Spécification GO": 200,
        "Spécification graisse": 100,
      },
      {
        "Année*": new Date().getFullYear(),
        "Parc*": parcs.length > 1 ? parcs[1].name : "Autre Parc",
        "Site*": sites.length > 1 ? sites[1].name : "Autre Site",
        Dispo: 90,
        MTBF: 7200,
        TDM: 8,
        "Spécification huile": 450,
        "Spécification GO": 180,
        "Spécification graisse": 90,
      },
    ];

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
        comment = "Obligatoire. Année de l'objectif (ex: 2024).";
      } else if (header.includes("Parc")) {
        comment =
          "Obligatoire. Nom du parc existant. Disponibles: " +
          parcs.map((p) => p.name).join(", ");
      } else if (header.includes("Site")) {
        comment =
          "Obligatoire. Nom du site existant. Disponibles: " +
          sites.map((s) => s.name).join(", ");
      } else if (header.includes("Dispo")) {
        comment = "Optionnel. Objectif de disponibilité en % (0-100).";
      } else if (header.includes("MTBF")) {
        comment = "Optionnel. Objectif MTBF en heures.";
      } else if (header.includes("TDM")) {
        comment = "Optionnel. Objectif TDM en % (0-100).";
      } else if (header.includes("huile")) {
        comment = "Optionnel. Spécification huile.";
      } else if (header.includes("GO")) {
        comment = "Optionnel. Spécification gazole.";
      } else if (header.includes("graisse")) {
        comment = "Optionnel. Spécification graisse.";
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
        "Content-Disposition": 'attachment; filename="template-objectifs.xlsx"',
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/objectifs/import:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du template" },
      { status: 500 }
    );
  }
}

// POST - Importation des objectifs
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
    let createdCount = 0;

    for (const rowData of data) {
      try {
        // Validation des données
        const validatedData = await objectifImportSchema.validate(rowData, {
          abortEarly: false,
        });

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

        // Vérifier si l'objectif existe déjà
        const existing = await prisma.objectif.findUnique({
          where: {
            annee_parcId_siteId: {
              annee: validatedData.annee,
              parcId,
              siteId,
            },
          },
        });

        if (existing) {
          errors.push({
            row: data.indexOf(rowData) + 2,
            field: "unique",
            value: `${validatedData.annee}-${validatedData.parc}-${validatedData.site}`,
            message:
              "Un objectif existe déjà pour cette année, ce parc et ce site",
            severity: "error",
          });
          continue;
        }

        // Créer l'objectif
        const newObjectif = await prisma.objectif.create({
          data: {
            annee: validatedData.annee,
            parcId,
            siteId,
            dispo: validatedData.dispo,
            mtbf: validatedData.mtbf,
            tdm: validatedData.tdm,
            spe_huile: validatedData.spe_huile,
            spe_go: validatedData.spe_go,
            spe_graisse: validatedData.spe_graisse,
          },
          include: {
            parc: true,
            site: true,
          },
        });

        results.push(newObjectif);
        createdCount++;
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
      fileName: "objectifs_import.xlsx",
      fileType: "xlsx",
      totalRecords: data.length,
      createdRecords: createdCount,
      updatedRecords: 0,
      errorRecords: errors.length,
      warningRecords: 0,
      status: errors.length === 0 ? "SUCCESS" : "PARTIAL",
      errorMessage:
        errors.length > 0 ? `${errors.length} erreurs détectées` : undefined,
    });

    return NextResponse.json({
      success: errors.length === 0,
      message: `${createdCount} objectif(s) créé(s) avec succès`,
      data: results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: data.length,
        created: createdCount,
        updated: 0,
        errors: errors.length,
        warnings: 0,
      },
    });
  } catch (error) {
    console.error("Erreur POST /api/objectifs/import:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'importation des objectifs" },
      { status: 500 }
    );
  }
}
