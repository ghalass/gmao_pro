import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";
import * as XLSX from "xlsx";
import {
  validateOrganeImportData,
  OrganeImportResult,
  ImportError,
  ImportSummary,
} from "@/lib/validation/organe-import.schema";
import { logImportOperation } from "@/lib/import-logger";

const the_resource = "organe";

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
          normalizedHeader.includes("organe") &&
          !normalizedHeader.includes("nouveau")
        ) {
          mapped.typeOrganeName = row[index];
        } else if (normalizedHeader.includes("marque")) {
          mapped.marque = row[index];
        } else if (
          normalizedHeader.includes("série") ||
          normalizedHeader.includes("sn")
        ) {
          mapped.sn = row[index];
        } else if (
          normalizedHeader.includes("date") &&
          normalizedHeader.includes("service")
        ) {
          mapped.date_mes = row[index];
        } else if (normalizedHeader.includes("origine")) {
          mapped.origine = row[index];
        } else if (normalizedHeader.includes("circuit")) {
          mapped.circuit = row[index];
        } else if (
          normalizedHeader.includes("hrm") &&
          normalizedHeader.includes("initial")
        ) {
          mapped.hrm_initial = row[index];
        } else if (
          normalizedHeader.includes("observation") ||
          normalizedHeader.includes("obs")
        ) {
          mapped.obs = row[index];
        } else if (
          normalizedHeader === "actif" ||
          normalizedHeader === "active"
        ) {
          mapped.active = row[index];
        }
      });

      return mapped;
    });

    // Valider les données
    const { valid, errors } = await validateOrganeImportData(
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
    const typeOrganes = await prisma.typeOrgane.findMany({
      where: { entrepriseId },
      select: { id: true, name: true },
    });

    // Créer une map pour le mapping rapide
    const typeOrganeMap = new Map(
      typeOrganes.map((t) => [t.name.toLowerCase(), t.id])
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
        // Mapper le nom du type d'organe vers l'ID
        const typeOrganeId = item.typeOrganeName
          ? typeOrganeMap.get(item.typeOrganeName.toLowerCase())
          : null;

        if (!typeOrganeId) {
          importErrors.push({
            row: 0,
            field: "typeOrganeName",
            value: item.typeOrganeName,
            message: `Le type d'organe "${item.typeOrganeName}" n'existe pas`,
            severity: "error",
          });
          summary.errors++;
          continue;
        }

        // Vérifier si l'organe existe déjà (même nom + même type + même entreprise)
        const existing = await prisma.organe.findFirst({
          where: {
            name: item.name,
            typeOrganeId,
            entrepriseId,
          },
        });

        if (existing) {
          importErrors.push({
            row: 0,
            field: "name",
            value: item.name,
            message: `L'organe "${item.name}" de type "${item.typeOrganeName}" existe déjà`,
            severity: "error",
          });
          summary.errors++;
        } else {
          // Créer le nouvel organe
          const created = await prisma.organe.create({
            data: {
              name: item.name,
              typeOrganeId,
              marque: item.marque,
              sn: item.sn,
              date_mes: item.date_mes,
              origine: item.origine,
              circuit: item.circuit,
              hrm_initial: item.hrm_initial
                ? parseFloat(item.hrm_initial.toString())
                : 0,
              obs: item.obs,
              active: item.active ?? true,
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
          type: r.typeOrganeId,
        })),
        errors: importErrors,
      }),
    });

    const result: OrganeImportResult = {
      success: summary.errors === 0,
      message:
        summary.errors === 0
          ? `${summary.created} organes créés avec succès`
          : `${summary.created} créés, ${summary.errors} erreurs`,
      data: createdRecords,
      errors: importErrors,
      summary,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur lors de l'importation des organes:", error);
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
    const typeOrganes = await prisma.typeOrgane.findMany({
      where: { entrepriseId },
      select: { name: true },
      take: 5,
    });

    // Créer les données du template avec exemples réels
    const templateData = [
      {
        "Nom*": "Organe Exemple 1",
        "Type organe*":
          typeOrganes.length > 0 ? typeOrganes[0].name : "Type Exemple",
        Marque: "Marque Exemple",
        "Numéro de série": "SN123456",
        "Date de mise en service": "15/01/2024",
        Origine: "BRC",
        Circuit: "Circuit A",
        "HRM initial": "1000.5",
        Observations: "Observations exemple",
        Actif: "true",
      },
      {
        "Nom*": "Organe Exemple 2",
        "Type organe*":
          typeOrganes.length > 0 ? typeOrganes[0].name : "Type Exemple",
        Marque: "",
        "Numéro de série": "",
        "Date de mise en service": "",
        Origine: "APPRO",
        Circuit: "",
        "HRM initial": "",
        Observations: "",
        Actif: "false",
      },
    ];

    // Créer le workbook et la feuille
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Organes");

    // Ajouter des commentaires sur les en-têtes
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:K1");
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;

      const header = worksheet[cellAddress].v;
      let comment = "";

      if (header.includes("Nom*") && !header.includes("Type")) {
        comment = "Obligatoire. Nom unique de l'organe.";
      } else if (header.includes("Type organe*")) {
        comment =
          "Obligatoire. Type d'organe associé. Disponibles: " +
          typeOrganes.map((t) => t.name).join(", ");
      } else if (header.includes("Marque")) {
        comment = "Optionnel. Marque de l'organe.";
      } else if (header.includes("Numéro de série")) {
        comment = "Optionnel. Numéro de série de l'organe.";
      } else if (header.includes("Date de mise en service")) {
        comment = "Optionnel. Date de mise en service (format: JJ/MM/AAAA).";
      } else if (header.includes("Origine")) {
        comment = "Optionnel. Origine (BRC, APPRO, AUTRE).";
      } else if (header.includes("Circuit")) {
        comment = "Optionnel. Circuit de l'organe.";
      } else if (header.includes("HRM initial")) {
        comment = "Optionnel. HRM initial (nombre décimal).";
      } else if (header.includes("Observations")) {
        comment = "Optionnel. Observations sur l'organe.";
      } else if (header.includes("Actif")) {
        comment = "Optionnel. Statut de l'organe (true/false, oui/non, 1/0).";
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
        "Content-Disposition": "attachment; filename=organes_template.xlsx",
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/organes/import:", error);
    return NextResponse.json(
      { message: "Erreur lors de la génération du template" },
      { status: 500 }
    );
  }
}
