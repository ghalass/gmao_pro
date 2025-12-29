// app/api/super-admin/entreprises/[entrepriseId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ entrepriseId: string }> } // Récupérer les params
) {
  try {
    // Récupérer le paramètre entrepriseId
    const { entrepriseId } = await context.params;

    console.log("Entreprise ID reçu:", entrepriseId);

    const session = await getSession();

    if (!session.isLoggedIn) {
      return NextResponse.json(
        { message: "Non autorisé, vous devez vous connecter" },
        { status: 401 }
      );
    }

    if (!session.userId) {
      return NextResponse.json(
        { message: "Non autorisé, ID utilisateur non trouvé" },
        { status: 401 }
      );
    }

    if (!session.isSuperAdmin) {
      return NextResponse.json(
        { message: "Non autorisé, vous n'êtes pas super-admin" },
        { status: 401 }
      );
    }

    // Récupérer UNE seule entreprise par son ID
    const entreprise = await prisma.entreprise.findUnique({
      where: {
        id: entrepriseId,
      },
      include: {
        users: {
          omit: {
            password: true,
          },
          include: {
            roles: {
              include: {
                permissions: true,
              },
            },
          },
        },
      },
    });

    // Si l'entreprise n'existe pas
    if (!entreprise) {
      return NextResponse.json(
        { message: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(entreprise);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'entreprise :", error);
    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
