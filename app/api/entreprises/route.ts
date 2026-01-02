// app/api/super-admin/entreprises/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn) {
      return NextResponse.json(
        { message: "Not authorisé, vous devez se connecter" },
        { status: 401 }
      );
    }

    if (!session.userId) {
      return NextResponse.json(
        { message: "Not authorisé, ID utilisateur non trouvé" },
        { status: 401 }
      );
    }

    if (!session.isSuperAdmin) {
      return NextResponse.json(
        { message: "Not authorisé, vous n'êtes pas super-admn" },
        { status: 401 }
      );
    }

    const entreprises = await prisma.entreprise.findMany();

    return NextResponse.json(entreprises);
  } catch (error) {
    console.error("Erreur lors de la récupération des entreprises :", error);
    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
