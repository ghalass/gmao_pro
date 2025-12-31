import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  protectDeleteRoute,
  protectReadRoute,
  protectUpdateRoute,
} from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "typelubrifiant";

// GET - Récupérer un typelubrifiant spécifique
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { id } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const typelubrifiant = await prisma.typelubrifiant.findFirst({
      where: {
        id,
        entrepriseId,
      },
      include: {
        lubrifiants: true, // Relation OneToMany avec Lubrifiant
      },
    });

    if (!typelubrifiant) {
      return NextResponse.json(
        { message: "Type de lubrifiant non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(typelubrifiant);
  } catch (error) {
    console.error("Error fetching typelubrifiant:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération du type de lubrifiant" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour un typelubrifiant
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const protectionError = await protectUpdateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { id } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    // Vérifier si le typelubrifiant existe
    const existingTypelubrifiant = await prisma.typelubrifiant.findFirst({
      where: {
        id,
        entrepriseId,
      },
    });

    if (!existingTypelubrifiant) {
      return NextResponse.json(
        { message: "Type de lubrifiant introuvable" },
        { status: 404 }
      );
    }

    // Validation: au moins un champ à mettre à jour
    if (name === undefined) {
      return NextResponse.json(
        { message: "Au moins un champ à mettre à jour est requis" },
        { status: 400 }
      );
    }

    // Vérifier l'unicité du nom si changé
    if (name && name.trim() !== existingTypelubrifiant.name) {
      const nameDuplicate = await prisma.typelubrifiant.findUnique({
        where: {
          name_entrepriseId: {
            name: name.trim(),
            entrepriseId,
          },
        },
      });
      if (nameDuplicate) {
        return NextResponse.json(
          { message: "Ce nom de type de lubrifiant est déjà utilisé" },
          { status: 409 }
        );
      }
    }

    const updatedTypelubrifiant = await prisma.typelubrifiant.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
      },
      include: {
        lubrifiants: true,
      },
    });

    return NextResponse.json(updatedTypelubrifiant);
  } catch (error) {
    console.error("Erreur PATCH /api/typelubrifiants/[id]:", error);
    return NextResponse.json(
      { message: "Erreur lors de la mise à jour du type de lubrifiant" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un typelubrifiant
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const protectionError = await protectDeleteRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { id } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const typelubrifiant = await prisma.typelubrifiant.findFirst({
      where: {
        id,
        entrepriseId,
      },
      include: {
        _count: {
          select: { lubrifiants: true },
        },
      },
    });

    if (!typelubrifiant) {
      return NextResponse.json(
        { message: "Type de lubrifiant introuvable" },
        { status: 404 }
      );
    }

    // Sécurité : Ne pas supprimer si lié à des lubrifiants
    if (typelubrifiant._count.lubrifiants > 0) {
      return NextResponse.json(
        {
          message:
            "Impossible de supprimer ce type de lubrifiant car il est lié à des lubrifiants.",
        },
        { status: 400 }
      );
    }

    await prisma.typelubrifiant.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Type de lubrifiant supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur DELETE /api/typelubrifiants/[id]:", error);
    return NextResponse.json(
      {
        message: "Erreur lors de la suppression du type de lubrifiant",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
