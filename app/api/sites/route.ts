import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "site";

// GET - Récupérer tous les sites de l'entreprise avec pagination
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

    // Gérer le cas "Tout afficher"
    const actualLimit = limit === -1 ? undefined : limit;
    const actualOffset = limit === -1 ? 0 : (page - 1) * limit;

    // Construire la clause where
    const where = {
      entrepriseId,
      ...(search && {
        name: {
          contains: search,
          mode: "insensitive" as const,
        },
      }),
    };

    // Récupérer les sites paginés et le total
    const [sites, total] = await Promise.all([
      prisma.site.findMany({
        where,
        include: {
          _count: {
            select: { engins: true },
          },
        },
        orderBy: { name: "asc" },
        skip: actualOffset,
        take: actualLimit,
      }),
      prisma.site.count({ where }),
    ]);

    // Calculer les informations de pagination
    const totalPages = limit === -1 ? 1 : Math.ceil(total / limit);
    const hasNextPage = limit === -1 ? false : page < totalPages;
    const hasPreviousPage = limit === -1 ? false : page > 1;

    return NextResponse.json({
      data: sites,
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
    console.error("Erreur GET /api/sites:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des sites" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau site
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
    const { name, active } = body;

    if (!name) {
      return NextResponse.json(
        { message: "Le nom est requis" },
        { status: 400 }
      );
    }

    // Vérifier l'unicité du nom pour cette entreprise
    const existing = await prisma.site.findUnique({
      where: {
        name_entrepriseId: {
          name: name.trim(),
          entrepriseId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Un site avec ce nom existe déjà" },
        { status: 409 }
      );
    }

    const site = await prisma.site.create({
      data: {
        name: name.trim(),
        active: active !== undefined ? active : true,
        entrepriseId,
      },
    });

    return NextResponse.json(site, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/sites:", error);
    return NextResponse.json(
      { message: "Erreur lors de la création du site" },
      { status: 500 }
    );
  }
}
