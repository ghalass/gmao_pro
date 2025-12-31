import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  protectDeleteRoute,
  protectReadRoute,
  protectUpdateRoute,
} from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";
import { formatErrorMessage } from "@/lib/error-handler";

const the_resource = "lubrifiant";

type Params = Promise<{ id: string }>;

// GET - Récupérer un type de consommation de lubrifiant par son ID
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const typeconsommationlub = await prisma.typeconsommationlub.findFirst({
      where: {
        id,
        entrepriseId,
      },
      include: {
        parcs: {
          include: {
            parc: {
              include: {
                typeparc: true,
              },
            },
          },
        },
        _count: {
          select: {
            saisielubrifiant: true,
          },
        },
      },
    });

    if (!typeconsommationlub) {
      return NextResponse.json(
        { message: "Type de consommation non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(typeconsommationlub);
  } catch (error) {
    console.error("Erreur GET /api/typeconsommationlubs/[id]:", error);
    const { message, status } = formatErrorMessage(
      error,
      "récupération du type de consommation de lubrifiant"
    );
    return NextResponse.json({ message }, { status });
  }
}

// PATCH - Mettre à jour un type de consommation de lubrifiant
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const protectionError = await protectUpdateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { name, parcIds } = body;

    // Vérifier si le type de consommation existe
    const existing = await prisma.typeconsommationlub.findFirst({
      where: {
        id,
        entrepriseId,
      },
      include: {
        parcs: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Type de consommation introuvable" },
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

    // Vérifier qu'au moins un parc est fourni si parcIds est défini
    if (parcIds !== undefined) {
      if (!Array.isArray(parcIds) || parcIds.length === 0) {
        return NextResponse.json(
          {
            message:
              "Au moins un parc doit être associé au type de consommation",
          },
          { status: 400 }
        );
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {};

    // Mettre à jour le nom si fourni
    if (name !== undefined) {
      if (name.trim() === "") {
        return NextResponse.json(
          { message: "Le nom ne peut pas être vide" },
          { status: 400 }
        );
      }

      // Vérifier l'unicité du nom si changé
      if (name.trim() !== existing.name) {
        const nameConflict = await prisma.typeconsommationlub.findUnique({
          where: {
            name_entrepriseId: {
              name: name.trim(),
              entrepriseId,
            },
          },
        });

        if (nameConflict) {
          return NextResponse.json(
            { message: "Ce nom est déjà utilisé" },
            { status: 409 }
          );
        }
      }

      updateData.name = name.trim();
    }

    // Gestion des parcs (relation ManyToMany)
    if (parcIds !== undefined) {
      // Vérifier que parcIds est un tableau
      if (!Array.isArray(parcIds)) {
        return NextResponse.json(
          { message: "Le champ 'parcIds' doit être un tableau" },
          { status: 400 }
        );
      }

      // Vérifier que les parcs existent et appartiennent à l'entreprise
      if (parcIds.length > 0) {
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
              message: `Les parcs suivants n'existent pas ou ne vous appartiennent pas: ${nonExistentParcs.join(
                ", "
              )}`,
            },
            { status: 400 }
          );
        }
      }

      // Récupérer les parcs actuels
      const currentParcIds = existing.parcs.map((p) => p.parcId);

      // Identifier les parcs à ajouter et à retirer
      const newParcIds = parcIds;
      const parcsToAdd = newParcIds.filter(
        (parcId: string) => !currentParcIds.includes(parcId)
      );
      const parcsToRemove = currentParcIds.filter(
        (parcId: string) => !newParcIds.includes(parcId)
      );

      // Préparer les opérations sur les parcs
      const parcOperations: any = {};

      if (parcsToAdd.length > 0) {
        parcOperations.create = parcsToAdd.map((parcId: string) => ({
          parcId,
        }));
      }

      if (parcsToRemove.length > 0) {
        parcOperations.deleteMany = parcsToRemove.map((parcId: string) => ({
          parcId,
        }));
      }

      // Ajouter les opérations de parcs aux données de mise à jour
      if (Object.keys(parcOperations).length > 0) {
        updateData.parcs = parcOperations;
      } else if (parcIds.length === 0 && currentParcIds.length > 0) {
        // Si on veut supprimer tous les parcs
        updateData.parcs = {
          deleteMany: {},
        };
      }
    }

    // Mettre à jour le type de consommation
    const updated = await prisma.typeconsommationlub.update({
      where: { id },
      data: updateData,
      include: {
        parcs: {
          include: {
            parc: {
              include: {
                typeparc: true,
              },
            },
          },
        },
        _count: {
          select: {
            saisielubrifiant: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur PATCH /api/typeconsommationlubs/[id]:", error);
    const { message, status } = formatErrorMessage(
      error,
      "mise à jour du type de consommation de lubrifiant"
    );
    return NextResponse.json({ message }, { status });
  }
}

// DELETE - Supprimer un type de consommation de lubrifiant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const protectionError = await protectDeleteRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    // Vérifier si le type de consommation existe et appartient à l'entreprise
    const existing = await prisma.typeconsommationlub.findFirst({
      where: {
        id,
        entrepriseId,
      },
      include: {
        _count: {
          select: {
            saisielubrifiant: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Type de consommation introuvable" },
        { status: 404 }
      );
    }

    // Vérifier s'il y a des saisies de lubrifiants associées
    if (existing._count.saisielubrifiant > 0) {
      return NextResponse.json(
        {
          message:
            "Impossible de supprimer ce type de consommation car il est utilisé dans des saisies de lubrifiants",
        },
        { status: 400 }
      );
    }

    // Supprimer le type de consommation (les relations avec les parcs seront automatiquement supprimées)
    await prisma.typeconsommationlub.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Type de consommation supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur DELETE /api/typeconsommationlubs/[id]:", error);
    const { message, status } = formatErrorMessage(
      error,
      "suppression du type de consommation de lubrifiant"
    );
    return NextResponse.json({ message }, { status });
  }
}
