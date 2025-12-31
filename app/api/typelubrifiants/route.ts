import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "typelubrifiant";

// GET - Récupérer tous les typelubrifiants
export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const typelubrifiants = await prisma.typelubrifiant.findMany({
      where: { entrepriseId },
      include: {
        lubrifiants: true, // Relation OneToMany avec Lubrifiant
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(typelubrifiants);
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
