// app/api/organes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  protectUpdateRoute,
  protectDeleteRoute,
  protectReadRoute,
} from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "organe";

// GET - Récupérer un organe spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const { id } = await params;

    const organe = await prisma.organe.findFirst({
      where: {
        id,
        entrepriseId: session.entrepriseId,
      },
      include: {
        type_organe: true,
      },
    });

    if (!organe) {
      return NextResponse.json({ error: "Organe non trouvé" }, { status: 404 });
    }

    return NextResponse.json(organe);
  } catch (error) {
    console.error("Erreur GET /api/organes/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'organe" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un organe
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const protectionError = await protectUpdateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const { id } = await params;
    const body = await request.json();

    // Vérifier que l'organe existe et appartient à l'entreprise
    const existingOrgane = await prisma.organe.findFirst({
      where: {
        id,
        entrepriseId: session.entrepriseId,
      },
    });

    if (!existingOrgane) {
      return NextResponse.json({ error: "Organe non trouvé" }, { status: 404 });
    }

    // Validation des données
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

    if (!name || !typeOrganeId) {
      return NextResponse.json(
        { error: "Le nom et le type d'organe sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que le type d'organe existe
    const typeOrgane = await prisma.typeOrgane.findFirst({
      where: {
        id: typeOrganeId,
        entrepriseId: session.entrepriseId,
      },
    });

    if (!typeOrgane) {
      return NextResponse.json(
        { error: "Type d'organe non trouvé" },
        { status: 400 }
      );
    }

    // Mettre à jour l'organe
    const updatedOrgane = await prisma.organe.update({
      where: { id },
      data: {
        name: name.trim(),
        typeOrganeId,
        marque: marque?.trim() || null,
        sn: sn?.trim() || null,
        date_mes: date_mes ? new Date(date_mes) : null,
        origine: origine || null,
        circuit: circuit?.trim() || null,
        hrm_initial: hrm_initial ? Number(hrm_initial) : 0,
        obs: obs?.trim() || null,
        active: active !== undefined ? Boolean(active) : true,
      },
      include: {
        type_organe: true,
      },
    });

    return NextResponse.json(updatedOrgane);
  } catch (error) {
    console.error("Erreur PUT /api/organes/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'organe" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un organe
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const protectionError = await protectDeleteRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const { id } = await params;

    // Vérifier que l'organe existe et appartient à l'entreprise
    const existingOrgane = await prisma.organe.findFirst({
      where: {
        id,
        entrepriseId: session.entrepriseId,
      },
    });

    if (!existingOrgane) {
      return NextResponse.json({ error: "Organe non trouvé" }, { status: 404 });
    }

    // Supprimer l'organe
    await prisma.organe.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Organe supprimé avec succès" });
  } catch (error) {
    console.error("Erreur DELETE /api/organes/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'organe" },
      { status: 500 }
    );
  }
}
