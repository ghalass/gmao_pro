import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  protectDeleteRoute,
  protectReadRoute,
  protectUpdateRoute,
} from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "site";

// GET - Récupérer un site spécifique
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ siteId: string }> }
) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { siteId } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        entrepriseId,
      },
      include: {
        engins: true,
      },
    });

    if (!site) {
      return NextResponse.json({ message: "Site non trouvé" }, { status: 404 });
    }

    return NextResponse.json(site);
  } catch (error) {
    console.error("Error fetching site:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération du site" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour un site
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ siteId: string }> }
) {
  try {
    const protectionError = await protectUpdateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { siteId } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    const body = await request.json();
    const { name, active } = body;

    const existingSite = await prisma.site.findFirst({
      where: {
        id: siteId,
        entrepriseId: entrepriseId!,
      },
    });

    if (!existingSite) {
      return NextResponse.json(
        { message: "Site introuvable" },
        { status: 404 }
      );
    }

    // Vérifier l'unicité du nom si changé
    if (name && name.trim() !== existingSite.name) {
      const nameDuplicate = await prisma.site.findUnique({
        where: {
          name_entrepriseId: {
            name: name.trim(),
            entrepriseId: entrepriseId!,
          },
        },
      });
      if (nameDuplicate) {
        return NextResponse.json(
          { message: "Ce nom de site est déjà utilisé" },
          { status: 409 }
        );
      }
    }

    const updatedSite = await prisma.site.update({
      where: { id: siteId }, // ID is unique globally, but we verified ownership above
      data: {
        name: name !== undefined ? name.trim() : undefined,
        active: active !== undefined ? active : undefined,
      },
    });

    return NextResponse.json(updatedSite);
  } catch (error) {
    console.error("Erreur PATCH /api/sites/[siteId]:", error);
    return NextResponse.json(
      { message: "Erreur lors de la mise à jour du site" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un site
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ siteId: string }> }
) {
  try {
    const protectionError = await protectDeleteRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { siteId } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        entrepriseId,
      },
      include: {
        _count: {
          select: { engins: true, Saisiehrm: true },
        },
      },
    });

    if (!site) {
      return NextResponse.json(
        { message: "Site introuvable" },
        { status: 404 }
      );
    }

    // Sécurité : Ne pas supprimer si lié à des engins ou des saisies hrm
    if (site._count.engins > 0 || site._count.Saisiehrm > 0) {
      return NextResponse.json(
        {
          message:
            "Impossible de supprimer ce site car il est lié à des engins ou des saisies hrm.",
        },
        { status: 400 }
      );
    }

    await prisma.site.delete({
      where: { id: siteId },
    });

    return NextResponse.json({ message: "Site supprimé avec succès" });
  } catch (error) {
    console.error("Erreur DELETE /api/sites:", error);
    return NextResponse.json(
      { message: "Erreur lors de la suppression du site" },
      { status: 500 }
    );
  }
}
