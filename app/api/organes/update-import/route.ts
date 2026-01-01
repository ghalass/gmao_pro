import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";
import * as XLSX from "xlsx";
import {
  validateOrganeUpdateImportData,
  OrganeUpdateImportResult,
  ImportError,
  ImportSummary,
} from "@/lib/validation/organe-update-import.schema";
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
        } else if (
          normalizedHeader.includes("nouveau") &&
          normalizedHeader.includes("nom") &&
          !normalizedHeader.includes("type")
        ) {
          mapped.newName = row[index];
        } else if (
          normalizedHeader.includes("nouveau") &&
          normalizedHeader.includes("type") &&
          normalizedHeader.includes("organe")
        ) {
          mapped.newTypeOrganeName = row[index];
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
    const { valid, errors } = await validateOrganeUpdateImportData(
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
        // Mapper le nom du type d'organe vers l'ID pour l'identification
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

        // Trouver l'organe existant
        const existing = await prisma.organe.findFirst({
          where: {
            name: item.name,
            typeOrganeId,
            entrepriseId,
          },
        });

        if (!existing) {
          importErrors.push({
            row: 0,
            field: "name",
            value: item.name,
            message: `L'organe "${item.name}" de type "${item.typeOrganeName}" n'existe pas`,
            severity: "error",
          });
          summary.errors++;
        } else {
          // Préparer les données de mise à jour
          const updateData: any = {};

          if (item.newName && item.newName !== existing.name) {
            updateData.name = item.newName;
          }

          if (item.newTypeOrganeName) {
            const newTypeOrganeId = typeOrganeMap.get(
              item.newTypeOrganeName.toLowerCase()
            );
            if (!newTypeOrganeId) {
              importErrors.push({
                row: 0,
                field: "newTypeOrganeName",
                value: item.newTypeOrganeName,
                message: `Le nouveau type d'organe "${item.newTypeOrganeName}" n'existe pas`,
                severity: "error",
              });
              summary.errors++;
              continue;
            }
            updateData.typeOrganeId = newTypeOrganeId;
          }

          if (item.marque !== undefined) {
            updateData.marque = item.marque;
          }

          if (item.sn !== undefined) {
            updateData.sn = item.sn;
          }

          if (item.date_mes !== undefined) {
            updateData.date_mes = item.date_mes;
          }

          if (item.origine !== undefined) {
            updateData.origine = item.origine;
          }

          if (item.circuit !== undefined) {
            updateData.circuit = item.circuit;
          }

          if (item.hrm_initial !== undefined) {
            updateData.hrm_initial = new Prisma.Decimal(
              item.hrm_initial.toString()
            );
          }

          if (item.obs !== undefined) {
            updateData.obs = item.obs;
          }

          if (item.active !== undefined) {
            updateData.active = item.active;
          }

          // Mettre à jour seulement s'il y a des changements
          if (Object.keys(updateData).length > 0) {
            const updated = await prisma.organe.update({
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
          type: r.typeOrganeId,
        })),
        errors: importErrors,
      }),
    });

    const result: OrganeUpdateImportResult = {
      success: summary.errors === 0,
      message:
        summary.errors === 0
          ? `${summary.updated} organes mis à jour avec succès`
          : `${summary.updated} mis à jour, ${summary.errors} erreurs`,
      data: updatedRecords,
      errors: importErrors,
      summary,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur lors de la mise à jour des organes:", error);
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

    // Récupérer les organes existants avec leurs relations
    const existingOrganes = await prisma.organe.findMany({
      where: { entrepriseId },
      select: {
        id: true,
        name: true,
        marque: true,
        sn: true,
        date_mes: true,
        origine: true,
        circuit: true,
        hrm_initial: true,
        obs: true,
        active: true,
        type_organe: { select: { name: true } },
      },
      take: 5,
    });

    // Récupérer les données de référence
    const typeOrganes = await prisma.typeOrgane.findMany({
      where: { entrepriseId },
      select: { name: true },
    });

    // Créer le template avec données existantes
    const templateData = existingOrganes.map((organe, index) => ({
      "Nom*": organe.name,
      "Type organe*": organe.type_organe?.name || "",
      "Nouveau nom": index === 0 ? "Nouveau nom exemple" : "",
      "Nouveau type organe":
        index === 0 ? (typeOrganes.length > 1 ? typeOrganes[1].name : "") : "",
      Marque: organe.marque || "",
      "Numéro de série": organe.sn || "",
      "Date de mise en service": organe.date_mes
        ? new Date(organe.date_mes).toLocaleDateString("fr-FR")
        : "",
      Origine: organe.origine || "",
      Circuit: organe.circuit || "",
      "HRM initial": new Prisma.Decimal(organe.hrm_initial?.toString() || "0"),
      Observations: organe.obs || "",
      Actif: organe.active ? "true" : "false",
    }));

    // Si aucune donnée existante, créer un exemple
    if (templateData.length === 0) {
      templateData.push({
        "Nom*": "Organe existant",
        "Type organe*":
          typeOrganes.length > 0 ? typeOrganes[0].name : "Type Exemple",
        "Nouveau nom": "Nouveau nom modifié",
        "Nouveau type organe":
          typeOrganes.length > 1 ? typeOrganes[1].name : "",
        Marque: "Nouvelle marque",
        "Numéro de série": "Nouveau SN",
        "Date de mise en service": "15/01/2024",
        Origine: "BRC",
        Circuit: "Nouveau circuit",
        "HRM initial": new Prisma.Decimal("1500.5"),
        Observations: "Nouvelles observations",
        Actif: "true",
      });
    }

    // Créer le workbook et la feuille
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Organes");

    // Ajouter des commentaires sur les en-têtes
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:M1");
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;

      const header = worksheet[cellAddress].v;
      let comment = "";

      if (header.includes("Nom*") && !header.includes("Type")) {
        comment =
          "Obligatoire. Organe existant à modifier. Disponibles: " +
          existingOrganes
            .map((o) => `${o.name} (${o.type_organe?.name})`)
            .join(", ");
      } else if (header.includes("Type organe*")) {
        comment =
          "Obligatoire. Type d'organe existant pour l'identification. Disponibles: " +
          typeOrganes.map((t) => t.name).join(", ");
      } else if (header.includes("Nouveau nom")) {
        comment = "Optionnel. Nouveau nom (si vide, pas de modification).";
      } else if (header.includes("Nouveau type organe")) {
        comment =
          "Optionnel. Nouveau type d'organe. Disponibles: " +
          typeOrganes.map((t) => t.name).join(", ");
      } else if (header.includes("Marque")) {
        comment = "Optionnel. Nouvelle marque.";
      } else if (header.includes("Numéro de série")) {
        comment = "Optionnel. Nouveau numéro de série.";
      } else if (header.includes("Date de mise en service")) {
        comment =
          "Optionnel. Nouvelle date de mise en service (format: JJ/MM/AAAA).";
      } else if (header.includes("Origine")) {
        comment = "Optionnel. Nouvelle origine (BRC, APPRO, AUTRE).";
      } else if (header.includes("Circuit")) {
        comment = "Optionnel. Nouveau circuit.";
      } else if (header.includes("HRM initial")) {
        comment = "Optionnel. Nouveau HRM initial (nombre décimal).";
      } else if (header.includes("Observations")) {
        comment = "Optionnel. Nouvelles observations.";
      } else if (header.includes("Actif")) {
        comment = "Optionnel. Nouveau statut (true/false, oui/non, 1/0).";
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
          "attachment; filename=organes_update_template.xlsx",
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/organes/update-import:", error);
    return NextResponse.json(
      { message: "Erreur lors de la génération du template" },
      { status: 500 }
    );
  }
}
