// app/api/super-admin/entreprises/[entrepriseId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Action } from "@/lib/generated/prisma/client";

type LANG = "fr" | "ar";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ entrepriseId: string }> }
) {
  try {
    const { entrepriseId } = await context.params;

    const session = await getSession();

    if (!session.isLoggedIn || !session.isSuperAdmin) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const entreprise = await prisma.entreprise.findUnique({
      where: { id: entrepriseId },
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
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            active: true,
            isOwner: true,
            isSuperAdmin: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        roles: {
          include: {
            _count: {
              select: {
                user: true,
                permissions: true,
              },
            },
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
    console.error("Erreur lors de la récupération de l'entreprise :", error);
    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ entrepriseId: string }> }
) {
  try {
    const { entrepriseId } = await context.params;
    const session = await getSession();

    if (!session.isLoggedIn || !session.isSuperAdmin) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { name, lang, active } = body;

    // Validation
    if (name && (typeof name !== "string" || name.trim().length === 0)) {
      return NextResponse.json(
        { message: "Le nom de l'entreprise est requis" },
        { status: 400 }
      );
    }

    if (lang && !["fr", "ar"].includes(lang)) {
      return NextResponse.json(
        { message: "La langue doit être 'fr' ou 'ar'" },
        { status: 400 }
      );
    }

    if (active !== undefined && typeof active !== "boolean") {
      return NextResponse.json(
        { message: "Le statut active doit être un booléen" },
        { status: 400 }
      );
    }

    // Vérifier si l'entreprise existe
    const existingEntreprise = await prisma.entreprise.findUnique({
      where: { id: entrepriseId },
    });

    if (!existingEntreprise) {
      return NextResponse.json(
        { message: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    // Si le nom est modifié, vérifier qu'il n'existe pas déjà
    if (name && name.trim() !== existingEntreprise.name) {
      const duplicateEntreprise = await prisma.entreprise.findUnique({
        where: { name: name.trim() },
      });

      if (duplicateEntreprise) {
        return NextResponse.json(
          { message: "Une entreprise avec ce nom existe déjà" },
          { status: 409 }
        );
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (lang) updateData.lang = lang as "fr" | "ar";
    if (active !== undefined) updateData.active = active;

    const entreprise = await prisma.entreprise.update({
      where: { id: entrepriseId },
      data: updateData,
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

    return NextResponse.json(entreprise);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'entreprise :", error);
    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ entrepriseId: string }> }
) {
  try {
    const { entrepriseId } = await context.params;
    const session = await getSession();

    if (!session.isLoggedIn || !session.isSuperAdmin) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    // Vérifier si l'entreprise existe
    const entreprise = await prisma.entreprise.findUnique({
      where: { id: entrepriseId },
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
        { message: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier les dépendances
    const dependencies = [];
    if (entreprise._count.users > 0) {
      dependencies.push(`${entreprise._count.users} utilisateur(s)`);
    }
    if (entreprise._count.sites > 0) {
      dependencies.push(`${entreprise._count.sites} site(s)`);
    }
    if (entreprise._count.engins > 0) {
      dependencies.push(`${entreprise._count.engins} engin(s)`);
    }

    if (dependencies.length > 0) {
      return NextResponse.json(
        {
          message: `Impossible de supprimer cette entreprise car elle contient : ${dependencies.join(
            ", "
          )}`,
          dependencies,
        },
        { status: 409 }
      );
    }

    // Supprimer l'entreprise (cascade supprimera automatiquement les rôles et permissions)
    await prisma.entreprise.delete({
      where: { id: entrepriseId },
    });

    return NextResponse.json(
      { message: "Entreprise supprimée avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression de l'entreprise :", error);
    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
