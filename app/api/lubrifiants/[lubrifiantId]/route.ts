import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  protectDeleteRoute,
  protectReadRoute,
  protectUpdateRoute,
} from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "lubrifiant";

// GET - Récupérer un lubrifiant spécifique
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ lubrifiantId: string }> }
) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { lubrifiantId } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const lubrifiant = await prisma.lubrifiant.findFirst({
      where: {
        id: lubrifiantId,
        entrepriseId,
      },
      include: {
        typelubrifiant: true, // Relation ManyToOne avec Typelubrifiant
        lubrifiantParc: {
          include: {
            parc: true, // Relation ManyToMany avec Parc via LubrifiantParc
          },
        },
        _count: {
          select: {
            saisielubrifiant: true, // Relation OneToMany avec Saisielubrifiant
          },
        },
      },
    });

    if (!lubrifiant) {
      return NextResponse.json(
        { message: "Lubrifiant non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(lubrifiant);
  } catch (error) {
    console.error("Error fetching lubrifiant:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération du lubrifiant" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour un lubrifiant
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ lubrifiantId: string }> }
) {
  try {
    const protectionError = await protectUpdateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { lubrifiantId } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { name, typelubrifiantId, parcIds } = body;

    // Vérifier si le lubrifiant existe
    const existingLubrifiant = await prisma.lubrifiant.findFirst({
      where: {
        id: lubrifiantId,
        entrepriseId,
      },
      include: {
        lubrifiantParc: true,
      },
    });

    if (!existingLubrifiant) {
      return NextResponse.json(
        { message: "Lubrifiant introuvable" },
        { status: 404 }
      );
    }

    // Validation: au moins un champ à mettre à jour
    if (
      name === undefined &&
      typelubrifiantId === undefined &&
      parcIds === undefined
    ) {
      return NextResponse.json(
        { message: "Au moins un champ à mettre à jour est requis" },
        { status: 400 }
      );
    }

    // Vérifier l'unicité du nom si changé
    if (name && name.trim() !== existingLubrifiant.name) {
      const nameDuplicate = await prisma.lubrifiant.findUnique({
        where: {
          name_entrepriseId: {
            name: name.trim(),
            entrepriseId,
          },
        },
      });
      if (nameDuplicate) {
        return NextResponse.json(
          { message: "Ce nom de lubrifiant est déjà utilisé" },
          { status: 409 }
        );
      }
    }

    // Vérifier que le typelubrifiant existe et appartient à l'entreprise (si changé)
    if (typelubrifiantId !== undefined) {
      const typelubrifiant = await prisma.typelubrifiant.findFirst({
        where: {
          id: typelubrifiantId,
          entrepriseId,
        },
      });

      if (!typelubrifiant) {
        return NextResponse.json(
          { message: "Type de lubrifiant introuvable ou non autorisé" },
          { status: 404 }
        );
      }
    }

    // Vérifier que les parcs existent et appartiennent à l'entreprise (si fournis)
    if (parcIds !== undefined) {
      // Vérifier qu'au moins un parc est fourni
      if (!Array.isArray(parcIds) || parcIds.length === 0) {
        return NextResponse.json(
          {
            message: "Au moins un parc doit être associé au lubrifiant",
          },
          { status: 400 }
        );
      }

      // Vérifier que les parcs existent et appartiennent à l'entreprise
      const parcs = await prisma.parc.findMany({
        where: {
          id: { in: parcIds },
          entrepriseId,
        },
        select: { id: true },
      });

      const existingParcIds = parcs.map((p) => p.id);
      const nonExistentParcs = parcIds.filter(
        (id: string) => !existingParcIds.includes(id)
      );

      if (nonExistentParcs.length > 0) {
        return NextResponse.json(
          {
            message: `Les parcs suivants n'existent pas ou ne sont pas autorisés: ${nonExistentParcs.join(
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

    if (typelubrifiantId !== undefined) {
      updateData.typelubrifiantId = typelubrifiantId;
    }

    // Gérer la relation ManyToMany avec Parc
    if (parcIds !== undefined) {
      // Supprimer toutes les relations existantes et créer les nouvelles
      await prisma.lubrifiantParc.deleteMany({
        where: {
          lubrifiantId,
        },
      });

      if (parcIds.length > 0) {
        updateData.lubrifiantParc = {
          create: parcIds.map((parcId: string) => ({
            parcId,
          })),
        };
      }
    }

    const updatedLubrifiant = await prisma.lubrifiant.update({
      where: { id: lubrifiantId },
      data: updateData,
      include: {
        typelubrifiant: true,
        lubrifiantParc: {
          include: {
            parc: true,
          },
        },
      },
    });

    return NextResponse.json(updatedLubrifiant);
  } catch (error) {
    console.error("Erreur PATCH /api/lubrifiants/[lubrifiantId]:", error);
    return NextResponse.json(
      { message: "Erreur lors de la mise à jour du lubrifiant" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un lubrifiant
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ lubrifiantId: string }> }
) {
  try {
    const protectionError = await protectDeleteRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { lubrifiantId } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const lubrifiant = await prisma.lubrifiant.findFirst({
      where: {
        id: lubrifiantId,
        entrepriseId,
      },
      include: {
        _count: {
          select: {
            saisielubrifiant: true, // Relation OneToMany avec Saisielubrifiant
            lubrifiantParc: true, // Relation ManyToMany avec Parc
          },
        },
      },
    });

    if (!lubrifiant) {
      return NextResponse.json(
        { message: "Lubrifiant introuvable" },
        { status: 404 }
      );
    }

    // Sécurité : Ne pas supprimer si lié à des saisies de lubrifiant
    if (lubrifiant._count.saisielubrifiant > 0) {
      return NextResponse.json(
        {
          message:
            "Impossible de supprimer ce lubrifiant car il est lié à des saisies de lubrifiant.",
        },
        { status: 400 }
      );
    }

    // Supprimer les relations ManyToMany avec Parc d'abord
    await prisma.lubrifiantParc.deleteMany({
      where: {
        lubrifiantId,
      },
    });

    // Supprimer le lubrifiant
    await prisma.lubrifiant.delete({
      where: { id: lubrifiantId },
    });

    return NextResponse.json({
      message: "Lubrifiant supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur DELETE /api/lubrifiants/[lubrifiantId]:", error);
    return NextResponse.json(
      {
        message: "Erreur lors de la suppression du lubrifiant",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

