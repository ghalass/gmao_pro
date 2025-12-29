// app/api/auth/me/route.ts - Version corrigée

import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({ message: "API IS READY", status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération des entreprises :", error);
    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
