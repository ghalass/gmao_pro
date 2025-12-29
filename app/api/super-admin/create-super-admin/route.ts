// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // check if data exist
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Veuillez renseigner les données " },
        { status: 400 }
      );
    }

    const superAdminToCreate = {
      name,
      email,
      password,
      active: true,
      isSuperAdmin: true,
    };

    // Étape 1: Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: superAdminToCreate.email },
    });
    if (existingUser) {
      return NextResponse.json(
        { message: "Super admin est déjà créé" },
        { status: 200 }
      );
    }

    // Étape 2: Vérifier si le rôle "super admin" existe déjà, sinon le créer
    let superAdminRole = await prisma.role.findUnique({
      where: { name: "super admin" },
    });
    if (!superAdminRole) {
      superAdminRole = await prisma.role.create({
        data: {
          name: "super admin",
          description: "Super Admin du site, a le pouvoir global sur le site",
        },
      });
    }

    // Étape 3: Hasher le mot de passe
    const hashedPassword = await hashPassword(superAdminToCreate.password);

    // Étape 4: Créer l'utilisateur avec la relation de rôle
    const newUser = await prisma.user.create({
      data: {
        email: superAdminToCreate.email.trim(),
        name: superAdminToCreate.name,
        password: hashedPassword,
        active: superAdminToCreate.active,
        isSuperAdmin: superAdminToCreate.isSuperAdmin,
        roles: {
          connect: [{ id: superAdminRole.id }], // Correction ici: utiliser un tableau d'objets avec id
        },
      },
      include: {
        roles: true,
      },
    });
    const createdSuperAdmin = {
      name: newUser.name,
      email: newUser.email,
      roles: newUser.roles,
    };

    return NextResponse.json(
      { message: "Super admin créé avec succès", user: createdSuperAdmin },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
