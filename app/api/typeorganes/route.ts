import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "typeorgane";

// GET - Récupérer tous les typeorganes
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
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          {
            parc: { name: { contains: search, mode: "insensitive" as const } },
          },
        ],
      }),
    };

    // Récupérer le total des items
    const totalItems = await prisma.typeOrgane.count({ where });

    const typeorganes = await prisma.typeOrgane.findMany({
      where,
      include: {
        parc: true,
        typeOrganeParcs: {
          include: {
            parc: true,
          },
        },
        _count: {
          select: {
            organes: true, // Relation One-to-Many avec Organe
          },
        },
      },
      orderBy: {
        name: "asc",
      },
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
      data: typeorganes,
      pagination,
    });
  } catch (error) {
    console.error("Erreur GET /api/typeorganes:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des types d'organes" },
      { status: 500 }
    );
  }
}

// POST - Créer un typeorgane
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
    const { name, parcIds } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { message: "Le nom est requis" },
        { status: 400 }
      );
    }

    // Vérifier l'unicité du nom
    const existingTypeorgane = await prisma.typeOrgane.findUnique({
      where: {
        name_entrepriseId: {
          name: name.trim(),
          entrepriseId,
        },
      },
    });

    if (existingTypeorgane) {
      return NextResponse.json(
        { message: "Ce nom de type d'organe est déjà utilisé" },
        { status: 400 }
      );
    }

    // Vérifier que les parcs existent et appartiennent à l'entreprise
    if (parcIds && Array.isArray(parcIds) && parcIds.length > 0) {
      const existingParcs = await prisma.parc.findMany({
        where: {
          id: { in: parcIds },
          entrepriseId,
        },
        select: { id: true },
      });

      const existingParcIds = existingParcs.map((p) => p.id);
      const nonExistentParcs = parcIds.filter(
        (parcId: string) => !existingParcIds.includes(parcId)
      );

      if (nonExistentParcs.length > 0) {
        return NextResponse.json(
          {
            message: `Les parcs suivants n'existent pas ou n'appartiennent pas à votre entreprise: ${nonExistentParcs.join(
              ", "
            )}`,
          },
          { status: 400 }
        );
      }
    }

    const typeorgane = await prisma.typeOrgane.create({
      data: {
        name: name.trim(),
        entrepriseId,
        typeOrganeParcs:
          parcIds && parcIds.length > 0
            ? {
                create: parcIds.map((parcId: string) => ({
                  parcId,
                })),
              }
            : undefined,
      },
      include: {
        typeOrganeParcs: {
          include: {
            parc: true,
          },
        },
        _count: {
          select: {
            organes: true,
          },
        },
      },
    });

    return NextResponse.json(typeorgane, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/typeorganes:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du type d'organe" },
      { status: 500 }
    );
  }
}
