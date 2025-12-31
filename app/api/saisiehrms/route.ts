import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";
import { formatErrorMessage } from "@/lib/error-handler";

const the_resource = "saisiehrm";

// GET - Récupérer toutes les saisies HRM de l'entreprise
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
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const siteId = searchParams.get("siteId");
    const typeparcId = searchParams.get("typeparcId");
    const parcId = searchParams.get("parcId");
    const enginId = searchParams.get("enginId");

    const where: any = { entrepriseId };

    if (from || to) {
      where.du = {};
      if (from) where.du.gte = new Date(from);
      if (to) where.du.lte = new Date(to);
    }

    if (siteId) where.siteId = siteId;

    if (enginId) {
      where.enginId = enginId;
    } else {
      const enginFilter: any = {};
      if (parcId || typeparcId) {
        enginFilter.parc = {};
        if (parcId) enginFilter.parc.id = parcId;
        if (typeparcId) enginFilter.parc.typeparcId = typeparcId;
      }
      if (Object.keys(enginFilter).length > 0) {
        where.engin = enginFilter;
      }
    }

    const saisiehrms = await prisma.saisiehrm.findMany({
      where,
      include: {
        engin: {
          include: {
            parc: {
              include: {
                typeparc: true,
              },
            },
          },
        },
        site: true,
        _count: {
          select: { saisiehim: true },
        },
      },
      orderBy: { du: "desc" },
    });

    return NextResponse.json(saisiehrms);
  } catch (error) {
    console.error("Erreur GET /api/saisiehrms:", error);
    const { message, status } = formatErrorMessage(
      error,
      "récupération des saisies HRM"
    );
    return NextResponse.json({ message }, { status });
  }
}

// POST - Créer une nouvelle saisie HRM
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
    const { du, enginId, siteId, hrm, compteur } = body;

    if (!du || !enginId || !siteId || hrm === undefined) {
      return NextResponse.json(
        { message: "La date, l'engin, le site et l'HRM sont requis" },
        { status: 400 }
      );
    }

    // Vérifier l'unicité du couple [du, enginId]
    const existing = await prisma.saisiehrm.findUnique({
      where: {
        du_enginId: {
          du: new Date(du),
          enginId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Une saisie HRM pour cet engin à cette date existe déjà" },
        { status: 409 }
      );
    }

    const saisiehrm = await prisma.saisiehrm.create({
      data: {
        du: new Date(du),
        enginId,
        siteId,
        hrm: parseFloat(hrm),
        compteur: compteur ? parseFloat(compteur) : null,
        entrepriseId,
      },
      include: {
        engin: true,
        site: true,
        _count: {
          select: { saisiehim: true },
        },
      },
    });

    return NextResponse.json(saisiehrm, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/saisiehrms:", error);
    const { message, status } = formatErrorMessage(
      error,
      "création de la saisie HRM"
    );
    return NextResponse.json({ message }, { status });
  }
}
