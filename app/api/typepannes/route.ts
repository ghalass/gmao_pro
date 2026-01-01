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

    // Récupérer les paramètres de pagination et de recherche
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    // Construire le where clause pour la recherche
    const where = {
      entrepriseId,
      ...(search && {
        name: { contains: search, mode: "insensitive" as const },
      }),
    };

    // Récupérer le total des items
    const totalItems = await prisma.typepanne.count({ where });

    // Récupérer les typepannes paginés
    const typepannes = await prisma.typepanne.findMany({
      where,
      include: {
        _count: {
          select: { pannes: true },
        },
      },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    });

    // Calculer les informations de pagination
    const totalPages = Math.ceil(totalItems / limit);

    const pagination = {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    return NextResponse.json({
      data: typepannes,
      pagination,
    });
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
