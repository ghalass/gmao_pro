import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "engin";

// GET - Récupérer tous les engins de l'entreprise
export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const engins = await prisma.engin.findMany({
      where: { entrepriseId },
      include: {
        parc: true,
        site: true,
        _count: {
          select: {
            saisiehrm: true,
            saisiehim: true,
            anomalies: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(engins);
  } catch (error) {
    console.error("Erreur GET /api/engins:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des engins" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel engin
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
    const { name, active, parcId, siteId, initialHeureChassis } = body;

    if (!name || !parcId || !siteId) {
      return NextResponse.json(
        { message: "Le nom, le parc et le site sont requis" },
        { status: 400 }
      );
    }

    // Vérifier l'unicité du nom pour cette entreprise
    const existing = await prisma.engin.findUnique({
      where: {
        name_entrepriseId: {
          name: name.trim(),
          entrepriseId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Un engin avec ce nom existe déjà" },
        { status: 409 }
      );
    }

    const engin = await prisma.engin.create({
      data: {
        name: name.trim(),
        active: active !== undefined ? active : true,
        parcId,
        siteId,
        initialHeureChassis: initialHeureChassis
          ? parseFloat(initialHeureChassis)
          : 0,
        entrepriseId,
      },
      include: {
        parc: true,
        site: true,
      },
    });

    return NextResponse.json(engin, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/engins:", error);
    return NextResponse.json(
      { message: "Erreur lors de la création de l'engin" },
      { status: 500 }
    );
  }
}
