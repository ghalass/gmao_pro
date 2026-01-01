// app/api/super-admin/users/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.isSuperAdmin) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const entrepriseId = searchParams.get("entrepriseId");
    const role = searchParams.get("role");
    const active = searchParams.get("active");

    const skip = (page - 1) * limit;

    // Construction des filtres
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (entrepriseId) {
      where.entrepriseId = entrepriseId;
    }

    if (role) {
      where.roles = {
        some: {
          name: role,
        },
      };
    }

    if (active !== null && active !== undefined) {
      where.active = active === "true";
    }

    // Exclure les super-admins des résultats normaux
    where.isSuperAdmin = false;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          active: true,
          isOwner: true,
          isSuperAdmin: true,
          createdAt: true,
          updatedAt: true,
          entreprise: {
            select: {
              id: true,
              name: true,
              active: true,
            },
          },
          roles: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Statistiques supplémentaires
    const stats = await prisma.user.groupBy({
      by: ["active"],
      _count: true,
      where: {
        isSuperAdmin: false,
      },
    });

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs :", error);
    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
