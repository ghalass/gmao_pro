import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "typelubrifiant";

// GET - Récupérer tous les typelubrifiants avec pagination
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

    // Récupérer les typelubrifiants paginés et le total
    const [typelubrifiants, total] = await Promise.all([
      prisma.typelubrifiant.findMany({
        where,
        include: {
          _count: {
            select: { lubrifiants: true },
          },
        },
        orderBy: { name: "asc" },
        skip: actualOffset,
        take: actualLimit,
      }),
      prisma.typelubrifiant.count({ where }),
    ]);

    // Calculer les informations de pagination
    const totalPages = limit === -1 ? 1 : Math.ceil(total / limit);
    const hasNextPage = limit === -1 ? false : page < totalPages;
    const hasPreviousPage = limit === -1 ? false : page > 1;

    return NextResponse.json({
      data: typelubrifiants,
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
    console.error("Erreur GET /api/typelubrifiants:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des types de lubrifiants" },
      { status: 500 }
    );
  }
}

// POST - Créer un typelubrifiant
export async function POST(request: NextRequest) {
  try {
    const protectionError = await protectCreateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que l'entreprise existe
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
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { message: "Le nom est requis" },
        { status: 400 }
      );
    }

    // Vérifier l'unicité du nom
    const existingTypelubrifiant = await prisma.typelubrifiant.findUnique({
      where: {
        name_entrepriseId: {
          name: name.trim(),
          entrepriseId,
        },
      },
    });

    if (existingTypelubrifiant) {
      return NextResponse.json(
        { message: "Ce nom de type de lubrifiant est déjà utilisé" },
        { status: 400 }
      );
    }

    const typelubrifiant = await prisma.typelubrifiant.create({
      data: {
        name: name.trim(),
        entrepriseId,
      },
      include: {
        lubrifiants: true,
      },
    });

    return NextResponse.json(typelubrifiant, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/typelubrifiants:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du type de lubrifiant" },
      { status: 500 }
    );
  }
}
