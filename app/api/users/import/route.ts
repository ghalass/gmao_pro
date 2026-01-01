import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { protectCreateRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";
import * as yup from "yup";
import {
  validateUserImportData,
  generateExcelTemplate,
} from "@/lib/validation/user-import.schema";
import * as XLSX from "xlsx";

const _resource = "user";

// GET - Télécharger le template Excel
export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectCreateRoute(request, _resource);
    if (protectionError) return protectionError;

    // Créer le template Excel avec XLSX
    const templateData = [
      {
        "email*": "admin@example.com",
        "password*": "password123",
        "name*": "Admin User",
        "roleId*": "admin",
        active: "true",
      },
      {
        "email*": "user@example.com",
        "password*": "password123",
        "name*": "Regular User",
        "roleId*": "user",
        active: "true",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

    // Ajouter des commentaires d'instructions
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:E1");
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;

      const header = worksheet[cellAddress].v;
      let comment = "";

      if (header.includes("email")) {
        comment = "Obligatoire. Email unique de l'utilisateur.";
      } else if (header.includes("password")) {
        comment = "Obligatoire. Mot de passe de l'utilisateur.";
      } else if (header.includes("name")) {
        comment = "Obligatoire. Nom complet de l'utilisateur.";
      } else if (header.includes("roleId")) {
        comment = "Obligatoire. ID du rôle de l'utilisateur.";
      } else if (header.includes("active")) {
        comment = "Optionnel. true/false. Défaut: true.";
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
        "Content-Disposition": 'attachment; filename="users_template.xlsx"',
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/users/import:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du template" },
      { status: 500 }
    );
  }
}

// POST - Importer les utilisateurs depuis Excel
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
        if (normalizedHeader.includes("email")) {
          mapped.email = row[index];
        } else if (normalizedHeader.includes("password")) {
          mapped.password = row[index];
        } else if (normalizedHeader.includes("name")) {
          mapped.name = row[index];
        } else if (normalizedHeader.includes("roleid")) {
          mapped.roleId = row[index];
        } else if (normalizedHeader.includes("active")) {
          mapped.active = row[index];
        }
      });

      return mapped;
    });

    // Valider les données
    const { valid, errors } = await validateUserImportData(
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
        },
        { status: 400 }
      );
    }

    const users = [];
    let created = 0;
    let updated = 0;

    // Traiter les données valides
    for (const userData of valid) {
      try {
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await prisma.user.findFirst({
          where: {
            email: { equals: userData.email, mode: "insensitive" },
            entrepriseId,
          },
        });

        if (existingUser) {
          // Mise à jour de l'utilisateur existant
          const hashedPassword = userData.password
            ? await bcrypt.hash(userData.password, 10)
            : existingUser.password;

          const updatedUser = await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              email: userData.email,
              name: userData.name,
              password: hashedPassword,
              roles: { connect: { id: userData.roleId } },
              active:
                userData.active !== undefined
                  ? userData.active
                  : existingUser.active,
            },
          });

          users.push(updatedUser);
          updated++;
        } else {
          // Création d'un nouvel utilisateur
          const hashedPassword = await bcrypt.hash(userData.password || "", 10);
          const newUser = await prisma.user.create({
            data: {
              email: userData.email,
              name: userData.name,
              password: hashedPassword,
              roles: { connect: { id: userData.roleId } },
              active: userData.active !== undefined ? userData.active : true,
              entrepriseId,
            },
          });

          users.push(newUser);
          created++;
        }
      } catch (userError) {
        console.error("Erreur lors du traitement de l'utilisateur:", userError);
      }
    }

    const success = errors.length === 0;
    const message = success
      ? `Importation réussie: ${created} créés, ${updated} mis à jour`
      : `Importation partielle: ${created} créés, ${updated} mis à jour, ${errors.length} erreurs`;

    return NextResponse.json({
      success,
      message,
      data: users,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: mappedData.length,
        created,
        updated,
        errors: errors.length,
      },
    });
  } catch (error) {
    console.error("Erreur POST /api/users/import:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de l'importation des utilisateurs",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
