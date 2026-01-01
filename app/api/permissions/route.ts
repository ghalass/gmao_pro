import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "permission";

// GET - Récupérer toutes les permissions de l'entreprise
export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json(
        { message: "Non autorisé : Aucune entreprise associée" },
        { status: 401 }
      );
    }

    // Récupérer les paramètres de pagination et de recherche
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const itemsPerPage = parseInt(searchParams.get("itemsPerPage") || "10");
    const search = searchParams.get("search") || "";

    // Calculer l'offset
    const offset = (page - 1) * itemsPerPage;

    // Construire le filtre de recherche
    const whereCondition: any = {
      entrepriseId,
    };

    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { resource: { contains: search, mode: "insensitive" } },
        // Recherche partielle impossible sur enum 'action'
      ];
    }

    // Récupérer le nombre total d'éléments
    const totalItems = await prisma.permission.count({
      where: whereCondition,
    });

    // Récupérer les permissions avec pagination
    const permissions = await prisma.permission.findMany({
      where: whereCondition,
      include: {
        roles: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ resource: "asc" }, { action: "asc" }],
      skip: offset,
      take: itemsPerPage,
    });

    // Calculer les informations de pagination
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return NextResponse.json({
      data: permissions,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage,
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/permissions:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des permissions" },
      { status: 500 }
    );
  }
}

// POST - Créer une permission
export async function POST(request: NextRequest) {
  try {
    const protectionError = await protectCreateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json(
        { message: "Non autorisé : Aucune entreprise associée" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { resource, action, description } = body;

    if (!resource || !action) {
      return NextResponse.json(
        { message: "Ressource et action sont requises" },
        { status: 400 }
      );
    }

    // Vérifier si elle existe déjà pour cette entreprise
    const existing = await prisma.permission.findUnique({
      where: {
        resource_action_entrepriseId: {
          resource: resource.toLowerCase().trim(),
          action: action.toLowerCase().trim() as any,
          entrepriseId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          message:
            "Cette permission existe déjà pour cette ressource et action.",
        },
        { status: 409 }
      );
    }

    const permission = await prisma.permission.create({
      data: {
        name: `${entrepriseId}:${action.toLowerCase().trim()}:${resource
          .toLowerCase()
          .trim()}`,
        resource: resource.toLowerCase().trim(),
        action: action.toLowerCase().trim() as any,
        description: description?.trim(),
        entrepriseId,
      },
    });

    return NextResponse.json(permission, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/permissions:", error);
    return NextResponse.json(
      { message: "Erreur lors de la création de la permission" },
      { status: 500 }
    );
  }
}
