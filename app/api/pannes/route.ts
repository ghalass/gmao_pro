import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "panne";

// GET - Récupérer toutes les pannes de l'entreprise
export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const pannes = await prisma.panne.findMany({
      where: { entrepriseId },
      include: {
        typepanne: true,
        parcs: true,
        _count: {
          select: { saisiehim: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(pannes);
  } catch (error) {
    console.error("Erreur GET /api/pannes:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des pannes" },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle panne
export async function POST(request: NextRequest) {
  try {
    const protectionError = await protectCreateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, typepanneId, parcIds } = body;

    if (!name || !typepanneId) {
      return NextResponse.json(
        { message: "Le nom et le type de panne sont requis" },
        { status: 400 }
      );
    }

    if (!parcIds || !Array.isArray(parcIds) || parcIds.length === 0) {
      return NextResponse.json(
        { message: "Une panne doit être associée à au moins un parc" },
        { status: 400 }
      );
    }

    // Vérifier l'unicité du nom pour cette entreprise
    const existing = await prisma.panne.findUnique({
      where: {
        name_entrepriseId: {
          name: name.trim(),
          entrepriseId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Une panne avec ce nom existe déjà" },
        { status: 409 }
      );
    }

    const panne = await prisma.panne.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        typepanneId,
        entrepriseId,
        parcs: {
          connect: parcIds?.map((id: string) => ({ id })) || [],
        },
      },
      include: {
        typepanne: true,
        parcs: true,
      },
    });

    return NextResponse.json(panne, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/pannes:", error);
    return NextResponse.json(
      { message: "Erreur lors de la création de la panne" },
      { status: 500 }
    );
  }
}
