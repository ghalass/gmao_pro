import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  protectDeleteRoute,
  protectReadRoute,
  protectUpdateRoute,
} from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "entreprise";

// GET - Récupérer une entreprise spécifique
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { id } = await context.params;
    const session = await getSession();

    if (!session?.isSuperAdmin) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const entreprise = await prisma.entreprise.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            sites: true,
            engins: true,
          },
        },
      },
    });

    if (!entreprise) {
      return NextResponse.json(
        { message: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(entreprise);
  } catch (error) {
    console.error("Error fetching entreprise:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération de l'entreprise" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour une entreprise
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const protectionError = await protectUpdateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { id } = await context.params;
    const session = await getSession();

    if (!session?.isSuperAdmin) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { name, lang, active } = body;

    const existingEntreprise = await prisma.entreprise.findUnique({
      where: { id },
    });

    if (!existingEntreprise) {
      return NextResponse.json(
        { message: "Entreprise introuvable" },
        { status: 404 }
      );
    }

    // Vérifier l'unicité du nom si changé
    if (name && name.trim() !== existingEntreprise.name) {
      const nameDuplicate = await prisma.entreprise.findUnique({
        where: { name: name.trim() },
      });
      if (nameDuplicate) {
        return NextResponse.json(
          { message: "Ce nom d'entreprise est déjà utilisé" },
          { status: 409 }
        );
      }
    }

    // Valider la langue si fournie
    if (lang && !["fr", "ar"].includes(lang)) {
      return NextResponse.json(
        { message: "La langue doit être 'fr' ou 'ar'" },
        { status: 400 }
      );
    }

    const updatedEntreprise = await prisma.entreprise.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        lang: lang !== undefined ? lang : undefined,
        active: active !== undefined ? active : undefined,
      },
    });

    return NextResponse.json(updatedEntreprise);
  } catch (error) {
    console.error("Erreur PATCH /api/entreprises/[id]:", error);
    return NextResponse.json(
      { message: "Erreur lors de la mise à jour de l'entreprise" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une entreprise
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const protectionError = await protectDeleteRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { id } = await context.params;
    const session = await getSession();

    if (!session?.isSuperAdmin) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const entreprise = await prisma.entreprise.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            sites: true,
            engins: true,
            roles: true,
            permissions: true,
          },
        },
      },
    });

    if (!entreprise) {
      return NextResponse.json(
        { message: "Entreprise introuvable" },
        { status: 404 }
      );
    }

    // Sécurité : Ne pas supprimer si lié à des données
    const totalDependencies =
      entreprise._count.users +
      entreprise._count.sites +
      entreprise._count.engins +
      entreprise._count.roles +
      entreprise._count.permissions;

    if (totalDependencies > 0) {
      return NextResponse.json(
        {
          message: `Impossible de supprimer cette entreprise car elle est liée à ${totalDependencies} éléments (utilisateurs, sites, engins, rôles ou permissions).`,
        },
        { status: 400 }
      );
    }

    await prisma.entreprise.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Entreprise supprimée avec succès" });
  } catch (error) {
    console.error("Erreur DELETE /api/entreprises/[id]:", error);
    return NextResponse.json(
      { message: "Erreur lors de la suppression de l'entreprise" },
      { status: 500 }
    );
  }
}
