import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";
import * as yup from "yup";
import * as XLSX from "xlsx";

const the_resource = "permission";

// Schéma de validation pour l'importation
const permissionImportSchema = yup.object().shape({
  name: yup.string().required("Le nom est obligatoire").trim(),
  description: yup
    .string()
    .optional()
    .nullable()
    .transform((v) => v || ""),
  resource: yup.string().required("La ressource est obligatoire").trim(),
  action: yup.string().required("L'action est obligatoire").trim(),
});

// GET - Télécharger le template Excel
export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectCreateRoute(request, the_resource);
    if (protectionError) return protectionError;

    // Créer le template Excel avec XLSX
    const templateData = [
      {
        "name*": "read_users",
        description: "Lire les utilisateurs",
        "resource*": "users",
        "action*": "read",
      },
      {
        "name*": "create_users",
        description: "Créer des utilisateurs",
        "resource*": "users",
        "action*": "create",
      },
      {
        "name*": "read_roles",
        description: "Lire les rôles",
        "resource*": "roles",
        "action*": "read",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Permissions");

    // Ajouter des commentaires d'instructions
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:D1");
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;

      const header = worksheet[cellAddress].v;
      let comment = "";

      if (header.includes("name")) {
        comment = "Obligatoire. Nom unique de la permission.";
      } else if (header.includes("description")) {
        comment = "Optionnel. Description de la permission.";
      } else if (header.includes("resource")) {
        comment = "Obligatoire. Ressource (ex: users, roles, etc.).";
      } else if (header.includes("action")) {
        comment = "Obligatoire. Action (read, create, update, delete).";
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
          'attachment; filename="permissions_template.xlsx"',
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/permissions/import:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du template" },
      { status: 500 }
    );
  }
}

// POST - Importer les permissions depuis Excel
export async function POST(request: NextRequest) {
  try {
    const protectionError = await protectCreateRoute(request, the_resource);
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
        } else if (normalizedHeader.includes("resource")) {
          mapped.resource = row[index];
        } else if (normalizedHeader.includes("action")) {
          mapped.action = row[index];
        }
      });

      return mapped;
    });

    const permissions = [];
    const errors = [];
    let created = 0;
    let updated = 0;

    // Traiter les données
    for (let i = 0; i < mappedData.length; i++) {
      const rowData = mappedData[i];
      const rowNumber = i + 2; // Excel row number

      try {
        // Valider les données
        await permissionImportSchema.validate(rowData, { abortEarly: false });

        // Vérifier si la permission existe déjà
        const existingPermission = await prisma.permission.findUnique({
          where: {
            resource_action_entrepriseId: {
              resource: rowData.resource.toLowerCase(),
              action: rowData.action.toLowerCase() as any,
              entrepriseId,
            },
          },
        });

        if (existingPermission) {
          // Mise à jour de la permission existante
          const updatedPermission = await prisma.permission.update({
            where: { id: existingPermission.id },
            data: {
              name: rowData.name,
              description: rowData.description || "",
            },
          });

          permissions.push(updatedPermission);
          updated++;
        } else {
          // Création d'une nouvelle permission
          const newPermission = await prisma.permission.create({
            data: {
              name: rowData.name,
              description: rowData.description || "",
              resource: rowData.resource.toLowerCase(),
              action: rowData.action.toLowerCase() as any,
              entrepriseId,
            },
          });

          permissions.push(newPermission);
          created++;
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
      ? `Importation réussie: ${created} créées, ${updated} mises à jour`
      : `Importation partielle: ${created} créées, ${updated} mises à jour, ${errors.length} erreurs`;

    return NextResponse.json({
      success,
      message,
      data: permissions,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: mappedData.length,
        created,
        updated,
        errors: errors.length,
      },
    });
  } catch (error) {
    console.error("Erreur POST /api/permissions/import:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de l'importation des permissions",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
