import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectReadRoute } from "@/lib/rbac/middleware";
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
        { action: { contains: search } }, // Pas de mode insensitive pour enum
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
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error: any) {
    console.error("Erreur GET /api/permissions:", error);
    return NextResponse.json(
      { message: "Erreur serveur", error: error.message },
      { status: 500 }
    );
  }
}
