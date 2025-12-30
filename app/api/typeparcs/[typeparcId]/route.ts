import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  protectDeleteRoute,
  protectReadRoute,
  protectUpdateRoute,
} from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "typeparc";

// GET - Récupérer un type de parc spécifique
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ typeparcId: string }> }
) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { typeparcId } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const typeparc = await prisma.typeparc.findFirst({
      where: {
        id: typeparcId,
        entrepriseId,
      },
      include: {
        parcs: true,
      },
    });

    if (!typeparc) {
      return NextResponse.json(
        { message: "Type de parc non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(typeparc);
  } catch (error) {
    console.error("Error fetching typeparc:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération du type de parc" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour un type de parc
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ typeparcId: string }> }
) {
  try {
    const protectionError = await protectUpdateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { typeparcId } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    const body = await request.json();
    const { name } = body;

    const existingTypeparc = await prisma.typeparc.findFirst({
      where: {
        id: typeparcId,
        entrepriseId: entrepriseId!,
      },
    });

    if (!existingTypeparc) {
      return NextResponse.json(
        { message: "Type de parc introuvable" },
        { status: 404 }
      );
    }

    // Vérifier l'unicité du nom si changé
    if (name && name.trim() !== existingTypeparc.name) {
      const nameDuplicate = await prisma.typeparc.findUnique({
        where: {
          name_entrepriseId: {
            name: name.trim(),
            entrepriseId: entrepriseId!,
          },
        },
      });
      if (nameDuplicate) {
        return NextResponse.json(
          { message: "Ce nom de type de parc est déjà utilisé" },
          { status: 409 }
        );
      }
    }

    const updatedTypeparc = await prisma.typeparc.update({
      where: { id: typeparcId },
      data: {
        name: name !== undefined ? name.trim() : undefined,
      },
    });

    return NextResponse.json(updatedTypeparc);
  } catch (error) {
    console.error("Erreur PATCH /api/typeparcs/[typeparcId]:", error);
    return NextResponse.json(
      { message: "Erreur lors de la mise à jour du type de parc" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un type de parc
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ typeparcId: string }> }
) {
  try {
    const protectionError = await protectDeleteRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { typeparcId } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const typeparc = await prisma.typeparc.findFirst({
      where: {
        id: typeparcId,
        entrepriseId,
      },
      include: {
        _count: {
          select: { parcs: true },
        },
      },
    });

    if (!typeparc) {
      return NextResponse.json(
        { message: "Type de parc introuvable" },
        { status: 404 }
      );
    }

    // Sécurité : Ne pas supprimer si lié à des parcs
    if (typeparc._count.parcs > 0) {
      return NextResponse.json(
        {
          message:
            "Impossible de supprimer ce type de parc car il est lié à des parcs.",
        },
        { status: 400 }
      );
    }

    await prisma.typeparc.delete({
      where: { id: typeparcId },
    });

    return NextResponse.json({ message: "Type de parc supprimé avec succès" });
  } catch (error) {
    console.error("Erreur DELETE /api/typeparcs:", error);
    return NextResponse.json(
      { message: "Erreur lors de la suppression du type de parc" },
      { status: 500 }
    );
  }
}
