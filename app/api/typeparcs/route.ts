import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "typeparc";

// GET - Récupérer tous les types de parc de l'entreprise
export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    // Récupérer les paramètres de pagination et recherche
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    let limit = parseInt(url.searchParams.get("limit") || "10");
    const search = url.searchParams.get("search") || "";

    // Construire le filtre de recherche
    const where: any = { entrepriseId };
    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    // Récupérer le nombre total d'enregistrements
    const totalItems = await prisma.typeparc.count({ where });

    // Gérer le cas "afficher tout" (limit = -1)
    let skip = 0;
    let take: number | undefined = limit;

    if (limit === -1) {
      // Afficher tout
      skip = 0;
      take = undefined; // Pas de limite
    } else {
      skip = (page - 1) * limit;
      take = limit;
    }

    // Récupérer les données paginées
    const typeparcs = await prisma.typeparc.findMany({
      where,
      include: {
        _count: {
          select: { parcs: true },
        },
      },
      orderBy: { name: "asc" },
      ...(skip > 0 && { skip }),
      ...(take && { take }),
    });

    // Calculer les informations de pagination
    const itemsPerPageForCalc = limit === -1 ? totalItems : limit;
    const totalPages = limit === -1 ? 1 : Math.ceil(totalItems / limit);

    return NextResponse.json({
      data: typeparcs,
      pagination: {
        currentPage: limit === -1 ? 1 : page,
        totalPages,
        totalItems,
        itemsPerPage: itemsPerPageForCalc,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/typeparcs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des types de parc" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau type de parc
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
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { message: "Le nom est requis" },
        { status: 400 }
      );
    }

    // Vérifier l'unicité du nom pour cette entreprise
    const existing = await prisma.typeparc.findUnique({
      where: {
        name_entrepriseId: {
          name: name.trim(),
          entrepriseId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Un type de parc avec ce nom existe déjà" },
        { status: 409 }
      );
    }

    const typeparc = await prisma.typeparc.create({
      data: {
        name: name.trim(),
        entrepriseId,
      },
    });

    return NextResponse.json(typeparc, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/typeparcs:", error);
    return NextResponse.json(
      { message: "Erreur lors de la création du type de parc" },
      { status: 500 }
    );
  }
}
