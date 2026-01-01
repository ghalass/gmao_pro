import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";
import * as yup from "yup";
import * as XLSX from "xlsx";

const _resource = "role";

// Schéma de validation pour la mise à jour
const roleUpdateImportSchema = yup.object().shape({
  name: yup.string().required("Le nom est obligatoire").trim(),
  description: yup
    .string()
    .optional()
    .nullable()
    .transform((v) => v || ""),
});

// GET - Télécharger le template de mise à jour
export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectCreateRoute(request, _resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    // Récupérer les rôles existants
    const existingRoles = await prisma.role.findMany({
      where: { entrepriseId },
      select: {
        name: true,
        description: true,
      },
      orderBy: { name: "asc" },
    });

    // Créer le template avec XLSX
    const templateData = existingRoles.map((role) => ({
      "name*": role.name,
      description: role.description || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Roles Update");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="roles_update_template.xlsx"',
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/roles/update-import:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du template" },
      { status: 500 }
    );
  }
}

// POST - Mettre à jour les rôles depuis Excel
export async function POST(request: NextRequest) {
  try {
    const protectionError = await protectCreateRoute(request, _resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json(
        { message: "Non autorisé : Aucune entreprise associée" },
        { status: 401 }
      );
    }

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
        { message: "Type de fichier non supporté" },
        { status: 400 }
      );
    }

    // Lire le fichier Excel avec XLSX
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
        if (normalizedHeader.includes("name")) {
          mapped.name = row[index];
        } else if (normalizedHeader.includes("description")) {
          mapped.description = row[index];
        }
      });

      return mapped;
    });

    const roles = [];
    const errors = [];
    let updated = 0;

    // Traiter les données
    for (let i = 0; i < mappedData.length; i++) {
      const rowData = mappedData[i];
      const rowNumber = i + 2; // Excel row number

      try {
        // Valider les données
        await roleUpdateImportSchema.validate(rowData, { abortEarly: false });

        // Vérifier si le rôle existe
        const existingRole = await prisma.role.findFirst({
          where: {
            name: { equals: rowData.name, mode: "insensitive" },
            entrepriseId,
          },
        });

        if (existingRole) {
          // Mise à jour du rôle existant
          const updatedRole = await prisma.role.update({
            where: { id: existingRole.id },
            data: {
              name: rowData.name,
              description: rowData.description || "",
            },
          });

          roles.push(updatedRole);
          updated++;
        } else {
          errors.push({
            row: rowNumber,
            field: "general",
            value: JSON.stringify(rowData),
            message: `Rôle "${rowData.name}" non trouvé`,
          });
        }
      } catch (error) {
        if (error instanceof yup.ValidationError) {
          errors.push({
            row: rowNumber,
            field: error.errors[0] || "validation",
            value: JSON.stringify(rowData),
            message: error.errors.join(", "),
          });
        } else {
          errors.push({
            row: rowNumber,
            field: "general",
            value: JSON.stringify(rowData),
            message: error instanceof Error ? error.message : "Erreur inconnue",
          });
        }
      }
    }

    const success = errors.length === 0;
    const message = success
      ? `Mise à jour réussie: ${updated} rôles mis à jour`
      : `Mise à jour partielle: ${updated} mis à jour, ${errors.length} erreurs`;

    return NextResponse.json({
      success,
      message,
      data: roles,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: mappedData.length,
        updated,
        errors: errors.length,
      },
    });
  } catch (error) {
    console.error("Erreur POST /api/roles/update-import:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de la mise à jour des rôles",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
