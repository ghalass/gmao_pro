// app/api/organes/[organeId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectUpdateRoute, protectDeleteRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "organe";

// GET - Récupérer un organe spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organeId: string }> }
) {
  try {
    const session = await getSession();
    const { organeId } = await params;

    const organe = await prisma.organe.findFirst({
      where: {
        id: organeId,
        entrepriseId: session.entrepriseId,
      },
      include: {
        type_organe: true,
      },
    });

    if (!organe) {
      return NextResponse.json(
        { message: "Organe non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(organe);
  } catch (error) {
    console.error("Erreur GET /api/organes/[organeId]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'organe" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un organe
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ organeId: string }> }
) {
  try {
    const protectionError = await protectUpdateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const { organeId } = await params;

    // Vérifier que l'organe existe et appartient à l'entreprise
    const existingOrgane = await prisma.organe.findFirst({
      where: {
        id: organeId,
        entrepriseId: session.entrepriseId,
      },
    });

    if (!existingOrgane) {
      return NextResponse.json(
        { message: "Organe non trouvé" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      typeOrganeId,
      marque,
      sn,
      date_mes,
      origine,
      circuit,
      hrm_initial,
      obs,
      active,
    } = body;

    // Si le type d'organe est modifié, vérifier qu'il existe
    if (typeOrganeId && typeOrganeId !== existingOrgane.typeOrganeId) {
      const existingTypeOrgane = await prisma.typeOrgane.findUnique({
        where: {
          id: typeOrganeId,
          entrepriseId: session.entrepriseId,
        },
      });

      if (!existingTypeOrgane) {
        return NextResponse.json(
          { message: "Ce type d'organe n'existe pas" },
          { status: 400 }
        );
      }
    }

    // Vérifier si un autre organe avec le même nom et type existe déjà
    if (name && typeOrganeId) {
      const duplicateOrgane = await prisma.organe.findFirst({
        where: {
          name: name.trim(),
          typeOrganeId: typeOrganeId,
          entrepriseId: session.entrepriseId,
          id: { not: organeId }, // Exclure l'organe actuel
        },
      });

      if (duplicateOrgane) {
        return NextResponse.json(
          { message: "Un organe avec ce nom et ce type existe déjà" },
          { status: 400 }
        );
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {};

    if (name !== undefined) updateData.name = name.trim();
    if (typeOrganeId !== undefined) updateData.typeOrganeId = typeOrganeId;
    if (marque !== undefined) updateData.marque = marque.trim() || null;
    if (sn !== undefined) updateData.sn = sn.trim() || null;
    if (date_mes !== undefined)
      updateData.date_mes = date_mes ? new Date(date_mes) : null;
    if (origine !== undefined) updateData.origine = origine || null;
    if (circuit !== undefined) updateData.circuit = circuit.trim() || null;
    if (hrm_initial !== undefined) updateData.hrm_initial = hrm_initial;
    if (obs !== undefined) updateData.obs = obs.trim() || null;
    if (active !== undefined) updateData.active = Boolean(active);

    // Mettre à jour l'organe
    const organe = await prisma.organe.update({
      where: { id: organeId },
      data: updateData,
      include: {
        type_organe: true,
      },
    });

    return NextResponse.json(organe);
  } catch (error) {
    console.error("Erreur PUT /api/organes/[organeId]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'organe" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un organe
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ organeId: string }> }
) {
  try {
    const protectionError = await protectDeleteRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const { organeId } = await params;

    // Vérifier que l'organe existe et appartient à l'entreprise
    const existingOrgane = await prisma.organe.findFirst({
      where: {
        id: organeId,
        entrepriseId: session.entrepriseId,
      },
    });

    if (!existingOrgane) {
      return NextResponse.json(
        { message: "Organe non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier les dépendances (mouvements, révisions)
    const [mouvementsCount, revisionsCount] = await Promise.all([
      prisma.mvtOrgane.count({
        where: { organeId },
      }),
      prisma.revisionOrgane.count({
        where: { organeId },
      }),
    ]);

    if (mouvementsCount > 0 || revisionsCount > 0) {
      return NextResponse.json(
        {
          message:
            "Cet organe ne peut pas être supprimé car il a des mouvements ou des révisions associés",
        },
        { status: 400 }
      );
    }

    // Supprimer l'organe
    await prisma.organe.delete({
      where: { id: organeId },
    });

    return NextResponse.json(
      { message: "Organe supprimé avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur DELETE /api/organes/[organeId]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'organe" },
      { status: 500 }
    );
  }
}
