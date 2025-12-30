import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  protectDeleteRoute,
  protectReadRoute,
  protectUpdateRoute,
} from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "typepanne";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ typepanneId: string }> }
) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { typepanneId } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const typepanne = await prisma.typepanne.findFirst({
      where: {
        id: typepanneId,
        entrepriseId,
      },
      include: { pannes: true },
    });

    if (!typepanne) {
      return NextResponse.json(
        { message: "Type de panne non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(typepanne);
  } catch (error) {
    console.error("Error fetching typepanne:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération du type de panne" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ typepanneId: string }> }
) {
  try {
    const protectionError = await protectUpdateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { typepanneId } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    const body = await request.json();
    const { name, description } = body;

    const existingTypepanne = await prisma.typepanne.findFirst({
      where: {
        id: typepanneId,
        entrepriseId: entrepriseId!,
      },
    });

    if (!existingTypepanne) {
      return NextResponse.json(
        { message: "Type de panne introuvable" },
        { status: 404 }
      );
    }

    if (name && name.trim() !== existingTypepanne.name) {
      const nameDuplicate = await prisma.typepanne.findUnique({
        where: {
          name_entrepriseId: {
            name: name.trim(),
            entrepriseId: entrepriseId!,
          },
        },
      });
      if (nameDuplicate) {
        return NextResponse.json(
          { message: "Ce nom de type de panne est déjà utilisé" },
          { status: 409 }
        );
      }
    }

    const updatedTypepanne = await prisma.typepanne.update({
      where: { id: typepanneId },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        description:
          description !== undefined ? description?.trim() : undefined,
      },
    });

    return NextResponse.json(updatedTypepanne);
  } catch (error) {
    console.error("Erreur PATCH /api/typepannes/[typepanneId]:", error);
    return NextResponse.json(
      { message: "Erreur lors de la mise à jour du type de panne" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ typepanneId: string }> }
) {
  try {
    const protectionError = await protectDeleteRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { typepanneId } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const typepanne = await prisma.typepanne.findFirst({
      where: {
        id: typepanneId,
        entrepriseId,
      },
      include: {
        _count: {
          select: { pannes: true },
        },
      },
    });

    if (!typepanne) {
      return NextResponse.json(
        { message: "Type de panne introuvable" },
        { status: 404 }
      );
    }

    if (typepanne._count.pannes > 0) {
      return NextResponse.json(
        {
          message:
            "Impossible de supprimer ce type de panne car il est lié à des pannes.",
        },
        { status: 400 }
      );
    }

    await prisma.typepanne.delete({
      where: { id: typepanneId },
    });

    return NextResponse.json({ message: "Type de panne supprimé avec succès" });
  } catch (error) {
    console.error("Erreur DELETE /api/typepannes:", error);
    return NextResponse.json(
      { message: "Erreur lors de la suppression du type de panne" },
      { status: 500 }
    );
  }
}
