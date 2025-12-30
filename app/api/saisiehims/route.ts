import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "saisiehim";

// GET - Récupérer toutes les saisies HIM de l'entreprise (via saisiehrm)
export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const saisiehims = await prisma.saisiehim.findMany({
      where: {
        saisiehrm: {
          entrepriseId: entrepriseId,
        },
      },
      include: {
        panne: true,
        saisiehrm: true,
        engin: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(saisiehims);
  } catch (error) {
    console.error("Erreur GET /api/saisiehims:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des saisies HIM" },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle saisie HIM
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
    const { panneId, him, ni, saisiehrmId, obs, enginId } = body;

    if (!panneId || !him || !ni || !saisiehrmId || !enginId) {
      return NextResponse.json(
        { message: "Tous les champs obligatoires doivent être remplis" },
        { status: 400 }
      );
    }

    // Vérifier que la saisie HRM appartient à l'entreprise
    const hrm = await prisma.saisiehrm.findFirst({
      where: { id: saisiehrmId, entrepriseId },
    });

    if (!hrm) {
      return NextResponse.json(
        { message: "Saisie HRM non trouvée ou non autorisée" },
        { status: 404 }
      );
    }

    // Constraint check: hrm + sum(existing_hims) + new_him <= 24
    const existingHims = await prisma.saisiehim.findMany({
      where: { saisiehrmId },
    });
    const sumHims = existingHims.reduce((acc, curr) => acc + curr.him, 0);
    const newHimValue = parseFloat(him);

    if (hrm.hrm + sumHims + newHimValue > 24) {
      return NextResponse.json(
        {
          message: `La somme de l'HRM (${
            hrm.hrm
          }) et des HIM (actuel: ${sumHims} + nouveau: ${newHimValue}) ne peut pas dépasser 24 heures par jour. Total : ${
            hrm.hrm + sumHims + newHimValue
          }h`,
        },
        { status: 400 }
      );
    }

    // Vérifier l'unicité [panneId, saisiehrmId]
    const existing = await prisma.saisiehim.findUnique({
      where: {
        panneId_saisiehrmId: {
          panneId,
          saisiehrmId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Cette panne est déjà enregistrée pour cette session HRM" },
        { status: 409 }
      );
    }

    const saisiehim = await prisma.saisiehim.create({
      data: {
        panneId,
        him: parseFloat(him),
        ni: parseInt(ni),
        saisiehrmId,
        enginId,
        obs: obs || null,
      },
      include: {
        panne: true,
        saisiehrm: true,
        engin: true,
      },
    });

    return NextResponse.json(saisiehim, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/saisiehims:", error);
    return NextResponse.json(
      { message: "Erreur lors de la création de la saisie HIM" },
      { status: 500 }
    );
  }
}
