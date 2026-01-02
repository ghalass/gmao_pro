// app/api/roles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "role";

// GET - Récupérer tous les rôles
export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

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
      ];
    }

    // Récupérer le nombre total d'éléments
    const totalItems = await prisma.role.count({
      where: whereCondition,
    });

    // Récupérer les rôles avec pagination
    const roles = await prisma.role.findMany({
      where: whereCondition,
      include: {
        permissions: true,
        user: {
          omit: { password: true },
        },
        entreprise: true,
      },
      orderBy: {
        name: "asc",
      },
      skip: offset,
      take: itemsPerPage,
    });

    // Calculer les informations de pagination
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return NextResponse.json({
      data: roles,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage,
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/roles:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des rôles" },
      { status: 500 }
    );
  }
}

// POST - Créer un rôle
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

    // check entreprise exist
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

    const { name, description, permissions } = body;

    // Vérifier si le nom existe déjà
    const existingRole = await prisma.role.findUnique({
      where: { name_entrepriseId: { name, entrepriseId } },
    });

    if (existingRole) {
      return NextResponse.json(
        { message: "Ce nom de rôle est déjà utilisé" },
        { status: 409 }
      );
    }

    // Préparer les données de création
    const createData: any = {
      name: name.trim(),
      entrepriseId,
      description: description.trim(),
    };

    // Ajouter la description si elle existe
    if (
      description !== undefined &&
      description !== null &&
      description.trim() !== ""
    ) {
      createData.description = description.trim();
    }

    // Ajouter les permissions si elles existent
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      createData.permissions = {
        connect: permissions.map((permissionId: string) => ({
          id: permissionId,
        })),
      };
    }

    // Créer le rôle
    const role = await prisma.role.create({
      data: createData,
      // include: {
      //   permissions: true,
      // },
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error: any) {
    console.error("Erreur POST /api/roles:", error);
    return NextResponse.json(
      {
        error: error.message || "Erreur lors de la création du rôle",
      },
      { status: 500 }
    );
  }
}
