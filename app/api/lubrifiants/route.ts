import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "lubrifiant";

// GET - Récupérer tous les lubrifiants
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
            typelubrifiant: {
              name: { contains: search, mode: "insensitive" as const },
            },
          },
        ],
      }),
    };

    // Récupérer le total des items
    const totalItems = await prisma.lubrifiant.count({ where });

    const lubrifiants = await prisma.lubrifiant.findMany({
      where,
      include: {
        typelubrifiant: true, // Relation ManyToOne avec Typelubrifiant
        lubrifiantParc: {
          include: {
            parc: true, // Relation ManyToMany avec Parc via LubrifiantParc
          },
        },
        _count: {
          select: {
            saisielubrifiant: true, // Relation OneToMany avec Saisielubrifiant
          },
        },
      },
      orderBy: {
        createdAt: "desc",
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
      data: lubrifiants,
      pagination,
    });
  } catch (error) {
    console.error("Erreur GET /api/lubrifiants:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des lubrifiants" },
      { status: 500 }
    );
  }
}

// POST - Créer un lubrifiant
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
    const { name, typelubrifiantId, parcIds } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { message: "Le nom est requis" },
        { status: 400 }
      );
    }

    if (!typelubrifiantId) {
      return NextResponse.json(
        { message: "Le type de lubrifiant est requis" },
        { status: 400 }
      );
    }

    // Vérifier que le typelubrifiant existe et appartient à l'entreprise
    const typelubrifiant = await prisma.typelubrifiant.findFirst({
      where: {
        id: typelubrifiantId,
        entrepriseId,
      },
    });

    if (!typelubrifiant) {
      return NextResponse.json(
        { message: "Type de lubrifiant introuvable ou non autorisé" },
        { status: 404 }
      );
    }

    // Vérifier l'unicité du nom pour cette entreprise
    const existingLubrifiant = await prisma.lubrifiant.findUnique({
      where: {
        name_entrepriseId: {
          name: name.trim(),
          entrepriseId,
        },
      },
    });

    if (existingLubrifiant) {
      return NextResponse.json(
        { message: "Un lubrifiant avec ce nom existe déjà" },
        { status: 400 }
      );
    }

    // Vérifier qu'au moins un parc est fourni
    if (!parcIds || !Array.isArray(parcIds) || parcIds.length === 0) {
      return NextResponse.json(
        { message: "Au moins un parc doit être associé au lubrifiant" },
        { status: 400 }
      );
    }

    // Vérifier que les parcs existent et appartiennent à l'entreprise
    const parcs = await prisma.parc.findMany({
      where: {
        id: { in: parcIds },
        entrepriseId,
      },
      select: { id: true },
    });

    const existingParcIds = parcs.map((p) => p.id);
    const nonExistentParcs = parcIds.filter(
      (id: string) => !existingParcIds.includes(id)
    );

    if (nonExistentParcs.length > 0) {
      return NextResponse.json(
        {
          message: `Les parcs suivants n'existent pas ou ne sont pas autorisés: ${nonExistentParcs.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Créer le lubrifiant avec ses relations
    const lubrifiant = await prisma.lubrifiant.create({
      data: {
        name: name.trim(),
        typelubrifiantId,
        entrepriseId,
        lubrifiantParc: {
          create:
            parcIds?.map((parcId: string) => ({
              parcId,
            })) || [],
        },
      },
      include: {
        typelubrifiant: true,
        lubrifiantParc: {
          include: {
            parc: true,
          },
        },
      },
    });

    return NextResponse.json(lubrifiant, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/lubrifiants:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du lubrifiant" },
      { status: 500 }
    );
  }
}
