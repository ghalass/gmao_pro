import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  protectDeleteRoute,
  protectReadRoute,
  protectUpdateRoute,
} from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "panne";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ panneId: string }> }
) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { panneId } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const panne = await prisma.panne.findFirst({
      where: {
        id: panneId,
        entrepriseId,
      },
      include: {
        typepanne: true,
        parcs: true,
      },
    });

    if (!panne) {
      return NextResponse.json(
        { message: "Panne non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(panne);
  } catch (error) {
    console.error("Error fetching panne:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération de la panne" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ panneId: string }> }
) {
  try {
    const protectionError = await protectUpdateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { panneId } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    const body = await request.json();
    const { name, description, typepanneId, parcIds } = body;

    if (
      parcIds !== undefined &&
      (!Array.isArray(parcIds) || parcIds.length === 0)
    ) {
      return NextResponse.json(
        { message: "Une panne doit être associée à au moins un parc" },
        { status: 400 }
      );
    }

    const existingPanne = await prisma.panne.findFirst({
      where: {
        id: panneId,
        entrepriseId: entrepriseId!,
      },
      include: { parcs: true },
    });

    if (!existingPanne) {
      return NextResponse.json(
        { message: "Panne introuvable" },
        { status: 404 }
      );
    }

    if (name && name.trim() !== existingPanne.name) {
      const nameDuplicate = await prisma.panne.findUnique({
        where: {
          name_entrepriseId: {
            name: name.trim(),
            entrepriseId: entrepriseId!,
          },
        },
      });
      if (nameDuplicate) {
        return NextResponse.json(
          { message: "Ce nom de panne est déjà utilisé" },
          { status: 409 }
        );
      }
    }

    const updatedPanne = await prisma.panne.update({
      where: { id: panneId },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        description:
          description !== undefined ? description?.trim() : undefined,
        typepanneId: typepanneId !== undefined ? typepanneId : undefined,
        parcs:
          parcIds !== undefined
            ? {
                set: parcIds.map((id: string) => ({ id })),
              }
            : undefined,
      },
      include: {
        typepanne: true,
        parcs: true,
      },
    });

    return NextResponse.json(updatedPanne);
  } catch (error) {
    console.error("Erreur PATCH /api/pannes/[panneId]:", error);
    return NextResponse.json(
      { message: "Erreur lors de la mise à jour de la panne" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ panneId: string }> }
) {
  try {
    const protectionError = await protectDeleteRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { panneId } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const panne = await prisma.panne.findFirst({
      where: {
        id: panneId,
        entrepriseId,
      },
      include: {
        _count: {
          select: { saisiehim: true },
        },
      },
    });

    if (!panne) {
      return NextResponse.json(
        { message: "Panne introuvable" },
        { status: 404 }
      );
    }

    if (panne._count.saisiehim > 0) {
      return NextResponse.json(
        {
          message:
            "Impossible de supprimer cette panne car elle est liée à des saisies.",
        },
        { status: 400 }
      );
    }

    await prisma.panne.delete({
      where: { id: panneId },
    });

    return NextResponse.json({ message: "Panne supprimée avec succès" });
  } catch (error) {
    console.error("Erreur DELETE /api/pannes:", error);
    return NextResponse.json(
      { message: "Erreur lors de la suppression de la panne" },
      { status: 500 }
    );
  }
}
