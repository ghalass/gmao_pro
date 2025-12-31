import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  protectDeleteRoute,
  protectReadRoute,
  protectUpdateRoute,
} from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "typeorgane";

// GET - Récupérer un typeorgane spécifique
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

    const typeorgane = await prisma.typeOrgane.findFirst({
      where: {
        id,
        entrepriseId,
      },
      include: {
        typeOrganeParcs: {
          include: {
            parc: true,
          },
        },
        _count: {
          select: {
            organes: true, // Relation One-to-Many avec Organe
          },
        },
      },
    });

    if (!typeorgane) {
      return NextResponse.json(
        { message: "Type d'organe non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(typeorgane);
  } catch (error) {
    console.error("Error fetching typeorgane:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération du type d'organe" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour un typeorgane
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
    const { name, parcIds } = body;

    // Vérifier si le typeorgane existe
    const existingTypeorgane = await prisma.typeOrgane.findFirst({
      where: {
        id,
        entrepriseId,
      },
      include: {
        typeOrganeParcs: {
          include: {
            parc: true,
          },
        },
      },
    });

    if (!existingTypeorgane) {
      return NextResponse.json(
        { message: "Type d'organe introuvable" },
        { status: 404 }
      );
    }

    // Validation: au moins un champ à mettre à jour
    if (name === undefined && parcIds === undefined) {
      return NextResponse.json(
        { message: "Au moins un champ à mettre à jour est requis" },
        { status: 400 }
      );
    }

    // Vérifier l'unicité du nom si changé
    if (name && name.trim() !== existingTypeorgane.name) {
      const nameDuplicate = await prisma.typeOrgane.findUnique({
        where: {
          name_entrepriseId: {
            name: name.trim(),
            entrepriseId,
          },
        },
      });
      if (nameDuplicate) {
        return NextResponse.json(
          { message: "Ce nom de type d'organe est déjà utilisé" },
          { status: 409 }
        );
      }
    }

    // Vérifier que les parcs existent et appartiennent à l'entreprise
    if (parcIds !== undefined && Array.isArray(parcIds) && parcIds.length > 0) {
      const existingParcs = await prisma.parc.findMany({
        where: {
          id: { in: parcIds },
          entrepriseId,
        },
        select: { id: true },
      });

      const existingParcIds = existingParcs.map((p) => p.id);
      const nonExistentParcs = parcIds.filter(
        (parcId: string) => !existingParcIds.includes(parcId)
      );

      if (nonExistentParcs.length > 0) {
        return NextResponse.json(
          {
            message: `Les parcs suivants n'existent pas ou n'appartiennent pas à votre entreprise: ${nonExistentParcs.join(
              ", "
            )}`,
          },
          { status: 400 }
        );
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {};

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    // Gérer la relation Many-to-Many avec Parc via TypeOrganeParc
    if (parcIds !== undefined) {
      // Supprimer les anciennes associations
      await prisma.typeOrganeParc.deleteMany({
        where: { typeOrganeId: id },
      });

      // Créer les nouvelles associations si des parcIds sont fournis
      if (parcIds.length > 0) {
        await prisma.typeOrganeParc.createMany({
          data: parcIds.map((parcId: string) => ({
            typeOrganeId: id,
            parcId,
          })),
        });
      }
    }

    const updatedTypeorgane = await prisma.typeOrgane.update({
      where: { id },
      data: updateData,
      include: {
        typeOrganeParcs: {
          include: {
            parc: true,
          },
        },
        _count: {
          select: {
            organes: true,
          },
        },
      },
    });

    return NextResponse.json(updatedTypeorgane);
  } catch (error) {
    console.error("Erreur PATCH /api/typeorganes/[id]:", error);
    return NextResponse.json(
      { message: "Erreur lors de la mise à jour du type d'organe" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un typeorgane
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

    const typeorgane = await prisma.typeOrgane.findFirst({
      where: {
        id,
        entrepriseId,
      },
      include: {
        _count: {
          select: {
            organes: true, // Vérifier s'il y a des organes liés
          },
        },
      },
    });

    if (!typeorgane) {
      return NextResponse.json(
        { message: "Type d'organe introuvable" },
        { status: 404 }
      );
    }

    // Sécurité : Ne pas supprimer si lié à des organes
    if (typeorgane._count.organes > 0) {
      return NextResponse.json(
        {
          message:
            "Impossible de supprimer ce type d'organe car il est lié à des organes.",
        },
        { status: 400 }
      );
    }

    await prisma.typeOrgane.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Type d'organe supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur DELETE /api/typeorganes/[id]:", error);
    return NextResponse.json(
      {
        message: "Erreur lors de la suppression du type d'organe",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
