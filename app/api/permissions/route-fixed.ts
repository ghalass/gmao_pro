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

    // Récupérer les paramètres
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const itemsPerPage = parseInt(searchParams.get("itemsPerPage") || "10");
    const search = searchParams.get("search") || "";

    const offset = (page - 1) * itemsPerPage;

    // Approche alternative pour éviter les problèmes de cache
    let permissions;
    let totalItems;

    if (search) {
      // Recherche avec filtre manuel pour éviter les problèmes Prisma
      const allPermissions = await prisma.permission.findMany({
        where: { entrepriseId },
        include: {
          roles: { select: { id: true, name: true } },
        },
        orderBy: [{ resource: "asc" }, { action: "asc" }],
      });

      // Filtrage manuel côté serveur
      const filtered = allPermissions.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.description &&
            p.description.toLowerCase().includes(search.toLowerCase())) ||
          p.resource.toLowerCase().includes(search.toLowerCase()) ||
          p.action.toLowerCase().includes(search.toLowerCase())
      );

      totalItems = filtered.length;
      permissions = filtered.slice(offset, offset + itemsPerPage);
    } else {
      // Sans recherche, utilisation normale
      totalItems = await prisma.permission.count({
        where: { entrepriseId },
      });

      permissions = await prisma.permission.findMany({
        where: { entrepriseId },
        include: {
          roles: { select: { id: true, name: true } },
        },
        orderBy: [{ resource: "asc" }, { action: "asc" }],
        skip: offset,
        take: itemsPerPage,
      });
    }

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
