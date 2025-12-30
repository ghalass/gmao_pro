import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  protectDeleteRoute,
  protectReadRoute,
  protectUpdateRoute,
} from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "engin";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ enginId: string }> }
) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { enginId } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const engin = await prisma.engin.findFirst({
      where: {
        id: enginId,
        entrepriseId,
      },
      include: {
        parc: true,
        site: true,
        saisiehrm: true,
        saisiehim: true,
      },
    });

    if (!engin) {
      return NextResponse.json(
        { message: "Engin non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(engin);
  } catch (error) {
    console.error("Error fetching engin:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération de l'engin" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ enginId: string }> }
) {
  try {
    const protectionError = await protectUpdateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { enginId } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    const body = await request.json();
    const { name, active, parcId, siteId, initialHeureChassis } = body;

    const existingEngin = await prisma.engin.findFirst({
      where: {
        id: enginId,
        entrepriseId: entrepriseId!,
      },
    });

    if (!existingEngin) {
      return NextResponse.json(
        { message: "Engin introuvable" },
        { status: 404 }
      );
    }

    if (name && name.trim() !== existingEngin.name) {
      const nameDuplicate = await prisma.engin.findUnique({
        where: {
          name_entrepriseId: {
            name: name.trim(),
            entrepriseId: entrepriseId!,
          },
        },
      });
      if (nameDuplicate) {
        return NextResponse.json(
          { message: "Ce nom d'engin est déjà utilisé" },
          { status: 409 }
        );
      }
    }

    const updatedEngin = await prisma.engin.update({
      where: { id: enginId },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        active: active !== undefined ? active : undefined,
        parcId: parcId !== undefined ? parcId : undefined,
        siteId: siteId !== undefined ? siteId : undefined,
        initialHeureChassis:
          initialHeureChassis !== undefined
            ? parseFloat(initialHeureChassis)
            : undefined,
      },
      include: {
        parc: true,
        site: true,
      },
    });

    return NextResponse.json(updatedEngin);
  } catch (error) {
    console.error("Erreur PATCH /api/engins/[enginId]:", error);
    return NextResponse.json(
      { message: "Erreur lors de la mise à jour de l'engin" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ enginId: string }> }
) {
  try {
    const protectionError = await protectDeleteRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { enginId } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const engin = await prisma.engin.findFirst({
      where: {
        id: enginId,
        entrepriseId,
      },
      include: {
        _count: {
          select: {
            saisiehrm: true,
            saisiehim: true,
            anomalies: true,
          },
        },
      },
    });

    if (!engin) {
      return NextResponse.json(
        { message: "Engin introuvable" },
        { status: 404 }
      );
    }

    if (
      engin._count.saisiehrm > 0 ||
      engin._count.saisiehim > 0 ||
      engin._count.anomalies > 0
    ) {
      return NextResponse.json(
        {
          message:
            "Impossible de supprimer cet engin car il est lié à des saisies ou anomalies.",
        },
        { status: 400 }
      );
    }

    await prisma.engin.delete({
      where: { id: enginId },
    });

    return NextResponse.json({ message: "Engin supprimé avec succès" });
  } catch (error) {
    console.error("Erreur DELETE /api/engins:", error);
    return NextResponse.json(
      { message: "Erreur lors de la suppression de l'engin" },
      { status: 500 }
    );
  }
}
