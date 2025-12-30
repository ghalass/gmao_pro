import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "site";

// GET - Récupérer tous les sites de l'entreprise
export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const sites = await prisma.site.findMany({
      where: { entrepriseId },
      include: {
        _count: {
          select: { engins: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(sites);
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
