import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "typepanne";

// GET - Récupérer tous les types de panne de l'entreprise
export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const typepannes = await prisma.typepanne.findMany({
      where: { entrepriseId },
      include: {
        _count: {
          select: { pannes: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(typepannes);
  } catch (error) {
    console.error("Erreur GET /api/typepannes:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des types de panne" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau type de panne
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
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { message: "Le nom est requis" },
        { status: 400 }
      );
    }

    // Vérifier l'unicité du nom pour cette entreprise
    const existing = await prisma.typepanne.findUnique({
      where: {
        name_entrepriseId: {
          name: name.trim(),
          entrepriseId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Un type de panne avec ce nom existe déjà" },
        { status: 409 }
      );
    }

    const typepanne = await prisma.typepanne.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        entrepriseId,
      },
    });

    return NextResponse.json(typepanne, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/typepannes:", error);
    return NextResponse.json(
      { message: "Erreur lors de la création du type de panne" },
      { status: 500 }
    );
  }
}
