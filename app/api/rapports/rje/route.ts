import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";
import { formatErrorMessage } from "@/lib/error-handler";

const the_resource = "rapport_rje";

// GET - Générer le rapport RJE pour une date donnée
export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    if (!dateParam) {
      return NextResponse.json(
        { message: "Le paramètre date est requis" },
        { status: 400 }
      );
    }

    const selectedDate = new Date(dateParam);
    const selectedDateOnly = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    );

    // Calculer les périodes
    const startOfDay = new Date(selectedDateOnly);
    const endOfDay = new Date(selectedDateOnly);
    endOfDay.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(
      selectedDateOnly.getFullYear(),
      selectedDateOnly.getMonth(),
      1
    );
    const startOfYear = new Date(selectedDateOnly.getFullYear(), 0, 1);

    // Récupérer les données HRM pour toutes les périodes
    const hrmData = await prisma.saisiehrm.findMany({
      where: {
        entrepriseId,
        du: {
          gte: startOfYear,
          lte: endOfDay,
        },
      },
      include: {
        saisiehim: {
          include: {
            panne: true,
          },
        },
      },
    });

    // Filtrer les engins qui ont des saisies pour la période
    const enginIdsWithSaisies = new Set(hrmData.map((hrm) => hrm.enginId));

    // Récupérer uniquement les engins qui ont des saisies
    const engins = await prisma.engin.findMany({
      where: {
        entrepriseId,
        id: {
          in: Array.from(enginIdsWithSaisies),
        },
      },
      include: {
        site: true,
        parc: {
          include: {
            typeparc: true,
          },
        },
      },
      orderBy: [
        { site: { name: "asc" } },
        { parc: { name: "asc" } },
        { name: "asc" },
      ],
    });

    // Récupérer les objectifs pour l'année en cours
    const objectifs = await prisma.objectif.findMany({
      where: {
        annee: selectedDateOnly.getFullYear(),
        site: {
          entrepriseId,
        },
      },
    });

    // Fonctions de calcul
    const calculateNHO = (startDate: Date, endDate: Date) => {
      const days =
        Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
      return days * 24;
    };

    const calculateIndicators = (
      enginId: string,
      startDate: Date,
      endDate: Date
    ) => {
      const relevantHrm = hrmData.filter(
        (hrm) =>
          hrm.enginId === enginId && hrm.du >= startDate && hrm.du <= endDate
      );

      let totalHRM = 0;
      let totalHIM = 0;
      let totalNI = 0;

      relevantHrm.forEach((hrm) => {
        totalHRM += hrm.hrm;
        hrm.saisiehim.forEach((him) => {
          totalHIM += him.him;
          totalNI += him.ni;
        });
      });

      const nho = calculateNHO(startDate, endDate);
      const hrd = nho - (totalHIM + totalHRM);

      // Gérer les divisions par zéro
      const disp = nho > 0 ? (1 - totalHIM / nho) * 100 : 0;
      const tdm = nho > 0 ? (totalHRM / nho) * 100 : 0;
      const mttr = totalNI > 0 ? totalHIM / totalNI : 0;
      const mtbf = totalNI > 0 ? totalHRM / totalNI : 0;
      const util = totalHRM + hrd > 0 ? (totalHRM / (totalHRM + hrd)) * 100 : 0;

      return {
        disp: Math.round(disp * 100) / 100,
        tdm: Math.round(tdm * 100) / 100,
        mtbf: Math.round(mtbf * 100) / 100,
        hrm: totalHRM,
        him: totalHIM,
        ni: totalNI,
        hrd,
        nho,
      };
    };

    // Calculer les indicateurs pour chaque période
    const result = engins.map((engin) => {
      const dayIndicators = calculateIndicators(engin.id, startOfDay, endOfDay);
      const monthIndicators = calculateIndicators(
        engin.id,
        startOfMonth,
        endOfDay
      );
      const yearIndicators = calculateIndicators(
        engin.id,
        startOfYear,
        endOfDay
      );

      // Récupérer les objectifs pour ce site/parc spécifiquement
      const objectif = objectifs.find(
        (obj) => obj.siteId === engin.siteId && obj.parcId === engin.parcId
      );

      return {
        id: engin.id,
        name: engin.name,
        site: engin.site,
        parc: engin.parc,
        indicators: {
          day: dayIndicators,
          month: monthIndicators,
          year: yearIndicators,
        },
        objectif: objectif
          ? {
              dispo: objectif.dispo,
              tdm: objectif.tdm,
              mtbf: objectif.mtbf,
            }
          : null,
      };
    });

    // Grouper par site puis par parc
    const groupedBySite = result.reduce((acc, engin) => {
      const siteId = engin.site.id;
      if (!acc[siteId]) {
        acc[siteId] = {
          site: engin.site,
          parcs: {},
        };
      }

      const parcId = engin.parc.id;
      if (!acc[siteId].parcs[parcId]) {
        acc[siteId].parcs[parcId] = {
          parc: engin.parc,
          engins: [],
          objectif: null, // Ajouter l'objectif au niveau du parc
        };
      }

      acc[siteId].parcs[parcId].engins.push(engin);

      // Ajouter l'objectif au parc si un engin en a un
      if (engin.objectif && !acc[siteId].parcs[parcId].objectif) {
        acc[siteId].parcs[parcId].objectif = engin.objectif;
      }

      return acc;
    }, {} as any);

    // Calculer les objectifs agrégés
    const aggregatedObjectifs = {
      dispo:
        objectifs.reduce((sum, obj) => sum + (obj.dispo || 0), 0) /
          objectifs.length || 0,
      tdm:
        objectifs.reduce((sum, obj) => sum + (obj.tdm || 0), 0) /
          objectifs.length || 0,
      mtbf:
        objectifs.reduce((sum, obj) => sum + (obj.mtbf || 0), 0) /
          objectifs.length || 0,
    };

    return NextResponse.json({
      date: selectedDateOnly,
      sites: Object.values(groupedBySite),
      objectifs: aggregatedObjectifs,
      totalEngins: engins.length,
    });
  } catch (error) {
    console.error("Erreur GET /api/rapports/rje:", error);
    const { message, status } = formatErrorMessage(
      error,
      "génération du rapport RJE"
    );
    return NextResponse.json({ message }, { status });
  }
}
