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

// GET - Récupérer une saisie de lubrifiant par son ID
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

    const saisielubrifiant = await prisma.saisielubrifiant.findFirst({
      where: {
        id,
        saisiehim: {
          saisiehrm: {
            entrepriseId,
          },
        },
      },
      include: {
        lubrifiant: {
          include: {
            typelubrifiant: true,
          },
        },
        saisiehim: {
          include: {
            panne: true,
            engin: true,
          },
        },
        typeconsommationlub: true,
      },
    });

    if (!saisielubrifiant) {
      return NextResponse.json(
        { message: "Saisie de lubrifiant non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(saisielubrifiant);
  } catch (error) {
    console.error("Erreur GET /api/saisielubrifiants/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la saisie de lubrifiant" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour une saisie de lubrifiant
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
    const { lubrifiantId, qte, obs, typeconsommationlubId } = body;

    // Vérifier si la saisie existe et appartient à l'entreprise
    const existing = await prisma.saisielubrifiant.findFirst({
      where: {
        id,
        saisiehim: {
          saisiehrm: {
            entrepriseId,
          },
        },
      },
      include: {
        saisiehim: {
          include: {
            engin: {
              include: {
                parc: true,
              },
            },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Saisie de lubrifiant non trouvée" },
        { status: 404 }
      );
    }

    // Si un type de consommation est fourni, vérifier qu'il est associé au parc de l'engin
    if (typeconsommationlubId !== undefined) {
      if (typeconsommationlubId) {
        const parcId = existing.saisiehim.engin.parcId;
        const typeConsommationExists =
          await prisma.typeconsommationlubParc.findUnique({
            where: {
              parcId_typeconsommationlubId: {
                parcId,
                typeconsommationlubId,
              },
            },
          });

        if (!typeConsommationExists) {
          return NextResponse.json(
            {
              message:
                "Ce type de consommation n'est pas associé au parc de cet engin",
            },
            { status: 400 }
          );
        }
      }
    }

    // Vérifier le lubrifiant si changé
    if (lubrifiantId) {
      const lubrifiant = await prisma.lubrifiant.findFirst({
        where: {
          id: lubrifiantId,
          entrepriseId,
        },
      });

      if (!lubrifiant) {
        return NextResponse.json(
          { message: "Lubrifiant non trouvé ou non autorisé" },
          { status: 404 }
        );
      }
    }

    const updated = await prisma.saisielubrifiant.update({
      where: { id },
      data: {
        lubrifiantId: lubrifiantId || undefined,
        qte: qte !== undefined ? parseFloat(qte) : undefined,
        obs: obs !== undefined ? obs : undefined,
        typeconsommationlubId:
          typeconsommationlubId !== undefined
            ? typeconsommationlubId || null
            : undefined,
      },
      include: {
        lubrifiant: {
          include: {
            typelubrifiant: true,
          },
        },
        saisiehim: {
          include: {
            panne: true,
            engin: true,
          },
        },
        typeconsommationlub: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur PATCH /api/saisielubrifiants/[id]:", error);
    const { message, status } = formatErrorMessage(
      error,
      "mise à jour de la saisie de lubrifiant"
    );
    return NextResponse.json({ message }, { status });
  }
}

// DELETE - Supprimer une saisie de lubrifiant
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

    // Vérifier si la saisie appartient à l'entreprise
    const existing = await prisma.saisielubrifiant.findFirst({
      where: {
        id,
        saisiehim: {
          saisiehrm: {
            entrepriseId,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Saisie de lubrifiant non trouvée" },
        { status: 404 }
      );
    }

    await prisma.saisielubrifiant.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Saisie de lubrifiant supprimée avec succès",
    });
  } catch (error) {
    console.error("Erreur DELETE /api/saisielubrifiants/[id]:", error);
    const { message, status } = formatErrorMessage(
      error,
      "suppression de la saisie de lubrifiant"
    );
    return NextResponse.json({ message }, { status });
  }
}
