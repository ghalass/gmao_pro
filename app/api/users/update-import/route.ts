// app/api/users/update-import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { protectCreateRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";
import {
  validateUserUpdateImportData,
  generateUpdateExcelTemplate,
} from "@/lib/validation/user-update-import.schema";

const the_resource = "user";

// GET - Télécharger le template Excel pour mise à jour
export async function GET() {
  try {
    const templateData = generateUpdateExcelTemplate();

    // Create CSV template (simpler for updates)
    const csvContent = [
      "Email*,Nom,Actif,Propriétaire,Super Admin",
      ...templateData.map(
        (row) =>
          `"${row["Email*"]}","${row["Nom"] || ""}","${row["Actif"] || ""}","${
            row["Propriétaire"] || ""
          }","${row["Super Admin"] || ""}"`
      ),
    ].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=users_update_template.csv",
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/users/update-import:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du template" },
      { status: 500 }
    );
  }
}

// POST - Mettre à jour des utilisateurs depuis Excel
export async function POST(request: NextRequest) {
  try {
    const protectionError = await protectCreateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Read CSV file
    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "Fichier vide ou invalide" },
        { status: 400 }
      );
    }

    // Parse CSV
    const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.replace(/"/g, "").trim());
      const row: any = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });

      // Skip empty rows
      if (Object.values(row).every((value) => !value)) {
        continue;
      }

      data.push(row);
    }

    // Validate data
    const { valid, errors } = await validateUserUpdateImportData(
      data,
      session.entrepriseId || ""
    );

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        message: "Erreurs de validation trouvées",
        errors,
        summary: {
          total: data.length,
          created: 0,
          updated: 0,
          errors: errors.length,
          warnings: 0,
        },
      });
    }

    // Update users
    let updated = 0;
    const updateErrors: any[] = [];

    for (const userData of valid) {
      try {
        // Find user by email
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email },
        });

        if (!existingUser) {
          updateErrors.push({
            email: userData.email,
            error: "Utilisateur non trouvé",
          });
          continue;
        }

        // Prepare update data
        const updateData: any = {};

        if (userData.name !== undefined) {
          updateData.name = userData.name;
        }
        if (userData.active !== undefined) {
          updateData.active = userData.active;
        }
        if (userData.isOwner !== undefined) {
          updateData.isOwner = userData.isOwner;
        }
        if (userData.isSuperAdmin !== undefined) {
          updateData.isSuperAdmin = userData.isSuperAdmin;
        }

        // Only update if there are changes
        if (Object.keys(updateData).length > 0) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: updateData,
          });
          updated++;
        }
      } catch (error) {
        console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
        updateErrors.push({
          email: userData.email,
          error: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    }

    const success = updateErrors.length === 0;
    const message = success
      ? `Mise à jour réussie: ${updated} utilisateurs modifiés`
      : `Mise à jour partielle: ${updated} utilisateurs modifiés, ${updateErrors.length} erreurs`;

    return NextResponse.json({
      success,
      message,
      summary: {
        total: data.length,
        created: 0,
        updated,
        errors: updateErrors.length,
        warnings: 0,
      },
      errors: updateErrors,
    });
  } catch (error) {
    console.error("Erreur POST /api/users/update-import:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
