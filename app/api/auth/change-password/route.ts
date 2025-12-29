// app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { email, newPassword, currentPassword } = body;

    // check all data are provided
    if (!email || !newPassword || !currentPassword) {
      return NextResponse.json(
        {
          message:
            "Veuillez renseigner l'email, le mot de passe actuel et le nouveau.",
        },
        { status: 404 }
      );
    }
    // check if email exist
    const emailExist = await prisma.user.findUnique({ where: { email } });
    if (!emailExist) {
      return NextResponse.json(
        { message: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // check if currentPassword is correct
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      emailExist.password
    );
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { message: "Mot de passe actuel incorrect" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(newPassword);
    // Mettre à jour le mot de passe
    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        password: hashedPassword,
      },
      include: {
        roles: true,
      },
      omit: { password: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Erreur mise à jour profil:", error);
    return NextResponse.json(
      { message: "Erreur lors de la mise à jour du profil" },
      { status: 500 }
    );
  }
}
