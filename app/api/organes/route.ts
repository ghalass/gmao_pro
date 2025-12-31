// app/api/organes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "organe";

// GET - Récupérer tous les organes
export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();

    const organes = await prisma.organe.findMany({
      where: { entrepriseId: session.entrepriseId },
      include: {
        type_organe: true, // Relation directe avec TypeOrgane
      },
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json(organes);
  } catch (error) {
    console.error("Erreur GET /api/organes:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des organes" },
      { status: 500 }
    );
  }
}

// POST - Créer un organe
export async function POST(request: NextRequest) {
  try {
    const protectionError = await protectCreateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session.entrepriseId;

    // check entreprise exist
    const entreprise = await prisma.entreprise.findUnique({
      where: { id: entrepriseId },
    });
    if (!entreprise) {
      return NextResponse.json(
        { message: "Aucune entreprise associée à ce entrepriseID" },
        { status: 401 }
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

    // Vérifier que le type d'organe existe
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

    // Vérifier si un organe avec le même nom et type existe déjà
    const existingOrgane = await prisma.organe.findFirst({
      where: {
        name: name.trim(),
        typeOrganeId,
        entrepriseId: session.entrepriseId,
      },
    });

    if (existingOrgane) {
      return NextResponse.json(
        { message: "Un organe avec ce nom et ce type existe déjà" },
        { status: 400 }
      );
    }

    // Préparer les données de création
    const createData: any = {
      name: name.trim(),
      typeOrganeId,
      entrepriseId,
      active: active !== undefined ? Boolean(active) : true, // Par défaut actif
    };

    // Ajouter les champs optionnels
    if (marque) createData.marque = marque.trim();
    if (sn) createData.sn = sn.trim();
    if (date_mes) createData.date_mes = new Date(date_mes);
    if (origine) createData.origine = origine;
    if (circuit) createData.circuit = circuit.trim();
    if (hrm_initial !== undefined) createData.hrm_initial = hrm_initial;
    if (obs) createData.obs = obs.trim();

    // Créer l'organe
    const organe = await prisma.organe.create({
      data: createData,
      include: {
        type_organe: true,
      },
    });

    return NextResponse.json(organe, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/organes:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'organe" },
      { status: 500 }
    );
  }
}
