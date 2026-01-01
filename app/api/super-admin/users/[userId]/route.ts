// app/api/super-admin/users/[userId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const session = await getSession();

    if (!session.isLoggedIn || !session.isSuperAdmin) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        active: true,
        isOwner: true,
        isSuperAdmin: true,
        createdAt: true,
        updatedAt: true,
        entreprise: {
          select: {
            id: true,
            name: true,
            active: true,
            lang: true,
          },
        },
        roles: {
          select: {
            id: true,
            name: true,
            description: true,
            permissions: {
              select: {
                id: true,
                name: true,
                resource: true,
                action: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur :", error);
    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const session = await getSession();

    if (!session.isLoggedIn || !session.isSuperAdmin) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { active, name, email } = body;

    // Validation
    if (active !== undefined && typeof active !== "boolean") {
      return NextResponse.json(
        { message: "Le statut active doit être un booléen" },
        { status: 400 }
      );
    }

    if (name && (typeof name !== "string" || name.trim().length === 0)) {
      return NextResponse.json(
        { message: "Le nom de l'utilisateur est requis" },
        { status: 400 }
      );
    }

    if (email && (typeof email !== "string" || !email.includes("@"))) {
      return NextResponse.json(
        { message: "L'email doit être valide" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Si l'email est modifié, vérifier qu'il n'existe pas déjà
    if (email && email !== existingUser.email) {
      const duplicateUser = await prisma.user.findUnique({
        where: { email },
      });

      if (duplicateUser) {
        return NextResponse.json(
          { message: "Un utilisateur avec cet email existe déjà" },
          { status: 409 }
        );
      }
    }

    const updateData: any = {};
    if (active !== undefined) updateData.active = active;
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.trim();

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        active: true,
        isOwner: true,
        isSuperAdmin: true,
        createdAt: true,
        updatedAt: true,
        entreprise: {
          select: {
            id: true,
            name: true,
            active: true,
          },
        },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur :", error);
    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const session = await getSession();

    if (!session.isLoggedIn || !session.isSuperAdmin) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "reset-password") {
      // Vérifier si l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return NextResponse.json(
          { message: "Utilisateur non trouvé" },
          { status: 404 }
        );
      }

      // Générer un mot de passe temporaire
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      return NextResponse.json({
        message: "Mot de passe réinitialisé avec succès",
        tempPassword,
      });
    }

    return NextResponse.json(
      { message: "Action non reconnue" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erreur lors de l'action sur l'utilisateur :", error);
    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
