import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";
import { formatErrorMessage } from "@/lib/error-handler";

const the_resource = "lubrifiant"; // Utiliser la même ressource que lubrifiant

// GET - Récupérer toutes les saisies de lubrifiants de l'entreprise
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
    const saisiehimId = searchParams.get("saisiehimId");

    const where: any = {
      saisiehim: {
        saisiehrm: {
          entrepriseId,
        },
      },
    };

    if (saisiehimId) {
      where.saisiehimId = saisiehimId;
    }

    const saisielubrifiants = await prisma.saisielubrifiant.findMany({
      where,
      include: {
        lubrifiant: {
          include: {
            typelubrifiant: true,
          },
        },
        saisiehim: {
          include: {
            panne: true,
            engin: true,
          },
        },
        typeconsommationlub: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(saisielubrifiants);
  } catch (error) {
    console.error("Erreur GET /api/saisielubrifiants:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des saisies de lubrifiants" },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle saisie de lubrifiant
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
    const { lubrifiantId, qte, obs, saisiehimId, typeconsommationlubId } = body;

    if (!lubrifiantId || !qte || !saisiehimId) {
      return NextResponse.json(
        { message: "Le lubrifiant, la quantité et la saisie HIM sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que la saisie HIM appartient à l'entreprise
    const saisiehim = await prisma.saisiehim.findFirst({
      where: {
        id: saisiehimId,
        saisiehrm: {
          entrepriseId,
        },
      },
      include: {
        engin: {
          include: {
            parc: {
              include: {
                typesConsommationLub: {
                  include: {
                    typeconsommationlub: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!saisiehim) {
      return NextResponse.json(
        { message: "Saisie HIM non trouvée ou non autorisée" },
        { status: 404 }
      );
    }

    // Si un type de consommation est fourni, vérifier qu'il est associé au parc de l'engin
    if (typeconsommationlubId) {
      const parcId = saisiehim.engin.parcId;
      const typeConsommationExists =
        await prisma.typeconsommationlubParc.findUnique({
          where: {
            parcId_typeconsommationlubId: {
              parcId,
              typeconsommationlubId,
            },
          },
        });

      if (!typeConsommationExists) {
        return NextResponse.json(
          {
            message:
              "Ce type de consommation n'est pas associé au parc de cet engin",
          },
          { status: 400 }
        );
      }
    }

    // Vérifier que le lubrifiant appartient à l'entreprise
    const lubrifiant = await prisma.lubrifiant.findFirst({
      where: {
        id: lubrifiantId,
        entrepriseId,
      },
    });

    if (!lubrifiant) {
      return NextResponse.json(
        { message: "Lubrifiant non trouvé ou non autorisé" },
        { status: 404 }
      );
    }

    const saisielubrifiant = await prisma.saisielubrifiant.create({
      data: {
        lubrifiantId,
        qte: parseFloat(qte),
        obs: obs || null,
        saisiehimId,
        typeconsommationlubId: typeconsommationlubId || null,
      },
      include: {
        lubrifiant: {
          include: {
            typelubrifiant: true,
          },
        },
        saisiehim: {
          include: {
            panne: true,
            engin: true,
          },
        },
        typeconsommationlub: true,
      },
    });

    return NextResponse.json(saisielubrifiant, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/saisielubrifiants:", error);
    const { message, status } = formatErrorMessage(
      error,
      "création de la saisie de lubrifiant"
    );
    return NextResponse.json({ message }, { status });
  }
}
