import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "parc";

// GET - Récupérer tous les parcs de l'entreprise
export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const parcs = await prisma.parc.findMany({
      where: { entrepriseId },
      include: {
        typeparc: true,
        pannes: true,
        typeOrganes: true, // Inclure les types d'organes associés
        _count: {
          select: { engins: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(parcs);
  } catch (error) {
    console.error("Erreur GET /api/parcs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des parcs" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau parc
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
    const { name, typeparcId, panneIds } = body;

    if (!name || !typeparcId) {
      return NextResponse.json(
        { message: "Le nom et le type de parc sont requis" },
        { status: 400 }
      );
    }

    // Vérifier l'unicité du nom pour cette entreprise
    const existing = await prisma.parc.findUnique({
      where: {
        name_entrepriseId: {
          name: name.trim(),
          entrepriseId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Un parc avec ce nom existe déjà" },
        { status: 409 }
      );
    }

    const parc = await prisma.parc.create({
      data: {
        name: name.trim(),
        typeparcId,
        entrepriseId,
        pannes: {
          connect: panneIds?.map((id: string) => ({ id })) || [],
        },
      },
      include: {
        typeparc: true,
        pannes: true,
      },
    });

    return NextResponse.json(parc, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/parcs:", error);
    return NextResponse.json(
      { message: "Erreur lors de la création du parc" },
      { status: 500 }
    );
  }
}
