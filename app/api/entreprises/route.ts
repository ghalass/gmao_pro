import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "entreprise";

// GET - Récupérer toutes les entreprises avec pagination (pour super-admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.isSuperAdmin) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    // Récupérer les paramètres de pagination et de recherche
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    // Gérer le cas "Tout afficher"
    const actualLimit = limit === -1 ? undefined : limit;
    const actualOffset = limit === -1 ? 0 : (page - 1) * limit;

    // Construire la clause where
    const where = {
      ...(search && {
        name: {
          contains: search,
          mode: "insensitive" as const,
        },
      }),
    };

    // Récupérer les entreprises paginées et le total
    const [entreprises, total] = await Promise.all([
      prisma.entreprise.findMany({
        where,
        include: {
          _count: {
            select: {
              users: true,
              sites: true,
            },
          },
        },
        orderBy: { name: "asc" },
        skip: actualOffset,
        take: actualLimit,
      }),
      prisma.entreprise.count({ where }),
    ]);

    // Calculer les informations de pagination
    const totalPages = limit === -1 ? 1 : Math.ceil(total / limit);
    const hasNextPage = limit === -1 ? false : page < totalPages;
    const hasPreviousPage = limit === -1 ? false : page > 1;

    return NextResponse.json({
      data: entreprises,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage,
        hasPreviousPage,
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/entreprises:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des entreprises" },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle entreprise (pour super-admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.isSuperAdmin) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { name, lang, active } = body;

    if (!name || !lang) {
      return NextResponse.json(
        { message: "Le nom et la langue sont requis" },
        { status: 400 }
      );
    }

    if (!["fr", "ar"].includes(lang)) {
      return NextResponse.json(
        { message: "La langue doit être 'fr' ou 'ar'" },
        { status: 400 }
      );
    }

    // Vérifier l'unicité du nom
    const existing = await prisma.entreprise.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Une entreprise avec ce nom existe déjà" },
        { status: 409 }
      );
    }

    const entreprise = await prisma.entreprise.create({
      data: {
        name: name.trim(),
        lang,
        active: active !== undefined ? active : true,
      },
    });

    return NextResponse.json(entreprise, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/entreprises:", error);
    return NextResponse.json(
      { message: "Erreur lors de la création de l'entreprise" },
      { status: 500 }
    );
  }
}
