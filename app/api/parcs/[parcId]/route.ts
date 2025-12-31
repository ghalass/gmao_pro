import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  protectDeleteRoute,
  protectReadRoute,
  protectUpdateRoute,
} from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "parc";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ parcId: string }> }
) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { parcId } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const parc = await prisma.parc.findFirst({
      where: {
        id: parcId,
        entrepriseId,
      },
      include: {
        typeparc: true,
        pannes: true,
        engins: true,
        typeOrganes: true, // Inclure les types d'organes associés
      },
    });

    if (!parc) {
      return NextResponse.json({ message: "Parc non trouvé" }, { status: 404 });
    }

    return NextResponse.json(parc);
  } catch (error) {
    console.error("Error fetching parc:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération du parc" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ parcId: string }> }
) {
  try {
    const protectionError = await protectUpdateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { parcId } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    const body = await request.json();
    const { name, typeparcId, panneIds } = body;

    const existingParc = await prisma.parc.findFirst({
      where: {
        id: parcId,
        entrepriseId: entrepriseId!,
      },
      include: { pannes: true },
    });

    if (!existingParc) {
      return NextResponse.json(
        { message: "Parc introuvable" },
        { status: 404 }
      );
    }

    if (name && name.trim() !== existingParc.name) {
      const nameDuplicate = await prisma.parc.findUnique({
        where: {
          name_entrepriseId: {
            name: name.trim(),
            entrepriseId: entrepriseId!,
          },
        },
      });
      if (nameDuplicate) {
        return NextResponse.json(
          { message: "Ce nom de parc est déjà utilisé" },
          { status: 409 }
        );
      }
    }

    const updatedParc = await prisma.parc.update({
      where: { id: parcId },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        typeparcId: typeparcId !== undefined ? typeparcId : undefined,
        pannes:
          panneIds !== undefined
            ? {
                set: panneIds.map((id: string) => ({ id })),
              }
            : undefined,
      },
      include: {
        typeparc: true,
        pannes: true,
      },
    });

    return NextResponse.json(updatedParc);
  } catch (error) {
    console.error("Erreur PATCH /api/parcs/[parcId]:", error);
    return NextResponse.json(
      { message: "Erreur lors de la mise à jour du parc" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ parcId: string }> }
) {
  try {
    const protectionError = await protectDeleteRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { parcId } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const parc = await prisma.parc.findFirst({
      where: {
        id: parcId,
        entrepriseId,
      },
      include: {
        _count: {
          select: { engins: true },
        },
      },
    });

    if (!parc) {
      return NextResponse.json(
        { message: "Parc introuvable" },
        { status: 404 }
      );
    }

    if (parc._count.engins > 0) {
      return NextResponse.json(
        {
          message:
            "Impossible de supprimer ce parc car il est lié à des engins.",
        },
        { status: 400 }
      );
    }

    await prisma.parc.delete({
      where: { id: parcId },
    });

    return NextResponse.json({ message: "Parc supprimé avec succès" });
  } catch (error) {
    console.error("Erreur DELETE /api/parcs:", error);
    return NextResponse.json(
      { message: "Erreur lors de la suppression du parc" },
      { status: 500 }
    );
  }
}
