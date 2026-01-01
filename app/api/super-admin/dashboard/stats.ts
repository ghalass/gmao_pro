// app/api/super-admin/dashboard/stats.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.isSuperAdmin) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    // Statistiques globales
    const [
      totalEntreprises,
      totalUsers,
      totalSites,
      totalEngins,
      activeEntreprises,
      activeUsers,
      entreprisesWithUsers,
      recentEntreprises,
    ] = await Promise.all([
      // Total des entreprises
      prisma.entreprise.count(),

      // Total des utilisateurs
      prisma.user.count(),

      // Total des sites
      prisma.site.count(),

      // Total des engins
      prisma.engin.count(),

      // Entreprises actives
      prisma.entreprise.count({
        where: { active: true },
      }),

      // Utilisateurs actifs
      prisma.user.count({
        where: { active: true },
      }),

      // Entreprises avec des utilisateurs
      prisma.entreprise.count({
        where: {
          users: {
            some: {},
          },
        },
      }),

      // Entreprises récentes (derniers 30 jours)
      prisma.entreprise.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Statistiques par entreprise
    const entreprisesStats = await prisma.entreprise.findMany({
      select: {
        id: true,
        name: true,
        active: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            sites: true,
            engins: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10, // Top 10 entreprises les plus récentes
    });

    // Distribution des utilisateurs par rôle
    const roleDistribution = await prisma.role.groupBy({
      by: ["name"],
      _count: true,
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    });

    // Activité récente (dernières créations)
    const recentActivity = await prisma.entreprise.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        users: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    const stats = {
      overview: {
        totalEntreprises,
        totalUsers,
        totalSites,
        totalEngins,
        activeEntreprises,
        activeUsers,
        entreprisesWithUsers,
        recentEntreprises,
      },
      entreprisesStats,
      roleDistribution,
      recentActivity,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques :", error);
    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
