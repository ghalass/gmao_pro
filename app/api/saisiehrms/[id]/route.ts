import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  protectDeleteRoute,
  protectReadRoute,
  protectUpdateRoute,
} from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";
import { formatErrorMessage } from "@/lib/error-handler";

const the_resource = "saisiehrm";

type Params = Promise<{ id: string }>;

// GET - Récupérer une saisie HRM par son ID
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

    const saisiehrm = await prisma.saisiehrm.findFirst({
      where: {
        id,
        entrepriseId,
      },
      include: {
        engin: true,
        site: true,
        _count: {
          select: { saisiehim: true },
        },
      },
    });

    if (!saisiehrm) {
      return NextResponse.json(
        { message: "Saisie HRM non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(saisiehrm);
  } catch (error) {
    console.error("Erreur GET /api/saisiehrms/[id]:", error);
    const { message, status } = formatErrorMessage(
      error,
      "récupération de la saisie HRM"
    );
    return NextResponse.json({ message }, { status });
  }
}

// PATCH - Mettre à jour une saisie HRM
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
    const { du, enginId, siteId, hrm, compteur } = body;

    // Vérifier si la saisie existe et appartient à l'entreprise
    const existing = await prisma.saisiehrm.findFirst({
      where: { id, entrepriseId },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Saisie HRM non trouvée" },
        { status: 404 }
      );
    }

    // Si on change la date ou l'engin, vérifier l'unicité
    if (
      (du && new Date(du).getTime() !== existing.du.getTime()) ||
      (enginId && enginId !== existing.enginId)
    ) {
      const conflict = await prisma.saisiehrm.findFirst({
        where: {
          du: du ? new Date(du) : existing.du,
          enginId: enginId || existing.enginId,
          entrepriseId,
          NOT: { id },
        },
      });

      if (conflict) {
        return NextResponse.json(
          { message: "Une saisie HRM pour cet engin à cette date existe déjà" },
          { status: 409 }
        );
      }
    }

    // Constraint check: hrm + sum(hims) <= 24
    if (hrm !== undefined) {
      const hrmValue = parseFloat(hrm);
      const hims = await prisma.saisiehim.findMany({
        where: { saisiehrmId: id },
      });
      const sumHims = hims.reduce((acc, curr) => acc + curr.him, 0);

      if (hrmValue + sumHims > 24) {
        return NextResponse.json(
          {
            message: `La somme de l'HRM (${hrmValue}) et des HIM (${sumHims}) ne peut pas dépasser 24 heures par jour. Total actuel : ${
              hrmValue + sumHims
            }h`,
          },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.saisiehrm.update({
      where: { id },
      data: {
        du: du ? new Date(du) : undefined,
        enginId: enginId || undefined,
        siteId: siteId || undefined,
        hrm: hrm !== undefined ? parseFloat(hrm) : undefined,
        compteur:
          compteur !== undefined
            ? compteur
              ? parseFloat(compteur)
              : null
            : undefined,
      },
      include: {
        engin: true,
        site: true,
        _count: {
          select: { saisiehim: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur PATCH /api/saisiehrms/[id]:", error);
    const { message, status } = formatErrorMessage(
      error,
      "mise à jour de la saisie HRM"
    );
    return NextResponse.json({ message }, { status });
  }
}

// DELETE - Supprimer une saisie HRM
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
    const existing = await prisma.saisiehrm.findFirst({
      where: { id, entrepriseId },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Saisie HRM non trouvée" },
        { status: 404 }
      );
    }

    await prisma.saisiehrm.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Saisie HRM supprimée avec succès" });
  } catch (error) {
    console.error("Erreur DELETE /api/saisiehrms/[id]:", error);
    const { message, status } = formatErrorMessage(
      error,
      "suppression de la saisie HRM"
    );
    return NextResponse.json({ message }, { status });
  }
}
