import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "typelubrifiant";

// GET - Récupérer tous les types de lubrifiant
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
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { lubrifiants: true },
        },
      },
    });

    return NextResponse.json(typelubrifiants);
  } catch (error) {
    console.error("Erreur GET /api/typelubrifiants:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des types de lubrifiant" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau type de lubrifiant
export async function POST(request: NextRequest) {
  try {
    const protectionError = await protectCreateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const body = await request.json();
    const { name } = body;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    if (!name) {
      return NextResponse.json(
        { message: "Le nom est requis" },
        { status: 400 }
      );
    }

    // Vérifier l'unicité du nom pour cette entreprise
    const existing = await prisma.typelubrifiant.findFirst({
      where: {
        name: name.trim(),
        entrepriseId: entrepriseId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Un type de lubrifiant avec ce nom existe déjà" },
        { status: 409 }
      );
    }

    const typelubrifiant = await prisma.typelubrifiant.create({
      data: {
        name: name.trim(),
        entrepriseId: entrepriseId,
      },
    });

    return NextResponse.json(typelubrifiant, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/typelubrifiants:", error);
    return NextResponse.json(
      { message: "Erreur lors de la création du type de lubrifiant" },
      { status: 500 }
    );
  }
}
