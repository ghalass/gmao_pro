import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";
import { formatErrorMessage } from "@/lib/error-handler";

const the_resource = "lubrifiant"; // Utiliser la même ressource que lubrifiant

// GET - Récupérer tous les types de consommation de lubrifiants
export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parcId = searchParams.get("parcId");

    let where: any = {
      entrepriseId,
    };

    let include: any = {
      parcs: {
        include: {
          parc: {
            include: {
              typeparc: true,
            },
          },
        },
      },
      _count: {
        select: {
          saisielubrifiant: true,
        },
      },
    };

    // Si un parcId est fourni, filtrer les types de consommation associés à ce parc
    if (parcId) {
      where.parcs = {
        some: {
          parcId,
        },
      };
    }

    const typeconsommationlubs = await prisma.typeconsommationlub.findMany({
      where,
      include,
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(typeconsommationlubs);
  } catch (error) {
    console.error("Erreur GET /api/typeconsommationlubs:", error);
    return NextResponse.json(
      {
        error:
          "Erreur lors de la récupération des types de consommation de lubrifiants",
      },
      { status: 500 }
    );
  }
}

// POST - Créer un type de consommation de lubrifiant
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
        { message: "Aucune entreprise associée à cet entrepriseID" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, parcIds } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { message: "Le nom est requis" },
        { status: 400 }
      );
    }

    // Vérifier qu'au moins un parc est fourni
    if (!parcIds || !Array.isArray(parcIds) || parcIds.length === 0) {
      return NextResponse.json(
        {
          message: "Au moins un parc doit être associé au type de consommation",
        },
        { status: 400 }
      );
    }

    // Vérifier l'unicité du nom pour cette entreprise
    const existing = await prisma.typeconsommationlub.findUnique({
      where: {
        name_entrepriseId: {
          name: name.trim(),
          entrepriseId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Ce type de consommation existe déjà" },
        { status: 409 }
      );
    }

    // Vérifier que les parcs existent et appartiennent à l'entreprise
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
          message: `Les parcs suivants n'existent pas ou ne vous appartiennent pas: ${nonExistentParcs.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Préparer les données de création
    const createData: any = {
      name: name.trim(),
      entrepriseId,
      parcs: {
        create: parcIds.map((parcId: string) => ({
          parcId,
        })),
      },
    };

    // Créer le type de consommation
    const typeconsommationlub = await prisma.typeconsommationlub.create({
      data: createData,
      include: {
        parcs: {
          include: {
            parc: {
              include: {
                typeparc: true,
              },
            },
          },
        },
        _count: {
          select: {
            saisielubrifiant: true,
          },
        },
      },
    });

    return NextResponse.json(typeconsommationlub, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/typeconsommationlubs:", error);
    const { message, status } = formatErrorMessage(
      error,
      "création du type de consommation de lubrifiant"
    );
    return NextResponse.json({ message }, { status });
  }
}
