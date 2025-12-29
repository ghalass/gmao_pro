// app/api/auth/logout/route.ts

import { logout } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Logged out",
    });

    await logout();

    return response;
  } catch (error) {
    console.error("Erreur lors de la decconnexion:", error);
    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
