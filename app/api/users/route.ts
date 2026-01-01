// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "user";

// GET - Récupérer tous les utilisateurs
export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();

    // Récupérer les paramètres de pagination et de recherche
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    // Construire le where clause pour la recherche
    const where = {
      ...(session.entrepriseId && { entrepriseId: session.entrepriseId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    // Récupérer le total des items
    const totalItems = await prisma.user.count({ where });

    const users = await prisma.user.findMany({
      where,
      include: {
        roles: true, // Relation directe avec Role
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
      omit: { password: true },
    });

    // Calculer les informations de pagination
    const totalPages = Math.ceil(totalItems / limit);

    const pagination = {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    return NextResponse.json({
      data: users,
      pagination,
    });
  } catch (error) {
    console.error("Erreur GET /api/users:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des utilisateurs" },
      { status: 500 }
    );
  }
}

// POST - Créer un utilisateur
export async function POST(request: NextRequest) {
  try {
    const protectionError = await protectCreateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session.entrepriseId;

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
    const { email, name, password, roles, active } = body;

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Cet email est déjà utilisé" },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Vérifier que les rôles existent (optionnel mais recommandé)
    if (roles && Array.isArray(roles) && roles.length > 0) {
      const existingRoles = await prisma.role.findMany({
        where: {
          id: { in: roles },
        },
        select: { id: true },
      });

      // Vérifier si certains rôles n'existent pas
      const existingRoleIds = existingRoles.map((r) => r.id);
      const nonExistentRoles = roles.filter(
        (roleId: string) => !existingRoleIds.includes(roleId)
      );

      if (nonExistentRoles.length > 0) {
        return NextResponse.json(
          {
            message: `Les rôles suivants n'existent pas: ${nonExistentRoles.join(
              ", "
            )}`,
          },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        {
          message: `L'utilisateur doit avoir au moins 1 rôle`,
        },
        { status: 400 }
      );
    }

    // Préparer les données de création
    const createData: any = {
      email: email.trim(),
      name: name.trim(),
      entrepriseId,
      password: hashedPassword,
      active: active !== undefined ? Boolean(active) : true, // Par défaut actif
    };

    // Ajouter les rôles si spécifiés
    if (roles && Array.isArray(roles) && roles.length > 0) {
      createData.roles = {
        connect: roles.map((roleId: string) => ({ id: roleId })),
      };
    }

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: createData,
      include: {
        roles: true,
      },
      omit: { password: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/users:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'utilisateur" },
      { status: 500 }
    );
  }
}
