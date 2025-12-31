import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  protectDeleteRoute,
  protectReadRoute,
  protectUpdateRoute,
} from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";
import { formatErrorMessage } from "@/lib/error-handler";

const the_resource = "saisiehim";

type Params = Promise<{ id: string }>;

// GET - Récupérer une saisie HIM par son ID
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

    const saisiehim = await prisma.saisiehim.findFirst({
      where: {
        id,
        saisiehrm: {
          entrepriseId,
        },
      },
      include: {
        panne: true,
        saisiehrm: true,
        engin: true,
        saisielubrifiant: {
          include: {
            lubrifiant: {
              include: {
                typelubrifiant: true,
              },
            },
            typeconsommationlub: true,
          },
        },
      },
    });

    if (!saisiehim) {
      return NextResponse.json(
        { message: "Saisie HIM non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(saisiehim);
  } catch (error) {
    console.error("Erreur GET /api/saisiehims/[id]:", error);
    const { message, status } = formatErrorMessage(
      error,
      "récupération de la saisie HIM"
    );
    return NextResponse.json({ message }, { status });
  }
}

// PATCH - Mettre à jour une saisie HIM
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
    const { panneId, him, ni, obs } = body;

    // Vérifier si la saisie existe et appartient à l'entreprise
    const existing = await prisma.saisiehim.findFirst({
      where: {
        id,
        saisiehrm: {
          entrepriseId,
        },
      },
      include: {
        saisiehrm: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Saisie HIM non trouvée" },
        { status: 404 }
      );
    }

    // Constraint check: parent_hrm + sum(other_hims) + new_him <= 24
    if (him !== undefined) {
      const newHimValue = parseFloat(him);
      const otherHims = await prisma.saisiehim.findMany({
        where: {
          saisiehrmId: existing.saisiehrmId,
          NOT: { id },
        },
      });
      const sumOtherHims = otherHims.reduce((acc, curr) => acc + curr.him, 0);

      if (existing.saisiehrm.hrm + sumOtherHims + newHimValue > 24) {
        return NextResponse.json(
          {
            message: `La somme de l'HRM (${
              existing.saisiehrm.hrm
            }) et des HIM (autres: ${sumOtherHims} + nouveau: ${newHimValue}) ne peut pas dépasser 24 heures par jour. Total : ${
              existing.saisiehrm.hrm + sumOtherHims + newHimValue
            }h`,
          },
          { status: 400 }
        );
      }
    }

    // Si on change la panne, vérifier l'unicité
    if (panneId && panneId !== existing.panneId) {
      const conflict = await prisma.saisiehim.findFirst({
        where: {
          panneId,
          saisiehrmId: existing.saisiehrmId,
          NOT: { id },
        },
      });

      if (conflict) {
        return NextResponse.json(
          {
            message: "Cette panne est déjà enregistrée pour cette session HRM",
          },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.saisiehim.update({
      where: { id },
      data: {
        panneId: panneId || undefined,
        him: him !== undefined ? parseFloat(him) : undefined,
        ni: ni !== undefined ? parseInt(ni) : undefined,
        obs: obs !== undefined ? obs : undefined,
      },
      include: {
        panne: true,
        saisiehrm: true,
        engin: true,
        saisielubrifiant: {
          include: {
            lubrifiant: {
              include: {
                typelubrifiant: true,
              },
            },
            typeconsommationlub: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur PATCH /api/saisiehims/[id]:", error);
    const { message, status } = formatErrorMessage(
      error,
      "mise à jour de la saisie HIM"
    );
    return NextResponse.json({ message }, { status });
  }
}

// DELETE - Supprimer une saisie HIM
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
    const existing = await prisma.saisiehim.findFirst({
      where: {
        id,
        saisiehrm: {
          entrepriseId,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Saisie HIM non trouvée" },
        { status: 404 }
      );
    }

    await prisma.saisiehim.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Saisie HIM supprimée avec succès" });
  } catch (error) {
    console.error("Erreur DELETE /api/saisiehims/[id]:", error);
    const { message, status } = formatErrorMessage(
      error,
      "suppression de la saisie HIM"
    );
    return NextResponse.json({ message }, { status });
  }
}
