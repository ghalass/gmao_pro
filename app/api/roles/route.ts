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

    const roles = await prisma.role.findMany({
      where: {
        entrepriseId,
      },
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
    });

    return NextResponse.json(roles);
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
    console.log(body);

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
