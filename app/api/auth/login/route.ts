// app/api/auth/login/route.ts - Version corrigée avec relations implicites

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, verifyPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entrepriseName, email, password } = body;

    // check if data exist
    if (!body) {
      return NextResponse.json(
        { message: "Le corps de la requête ne doit pas être vide" },
        { status: 400 }
      );
    }

    // check if entrepriseName existe
    const entrepiseExist = await prisma.entreprise.findFirst({
      where: { name: entrepriseName },
    });
    if (!entrepiseExist)
      return NextResponse.json(
        { message: "Ce nom d'entreprise n'existe pas" },
        { status: 404 }
      );

    // find user with entreprise
    const user = await prisma.user.findUnique({
      where: {
        email,
        entrepriseId: entrepiseExist.id,
      },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
        entreprise: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Email ou mot de passe incorrect!" },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { message: "Email ou mot de passe incorrect!" },
        { status: 401 }
      );
    }

    if (!user.active) {
      return NextResponse.json(
        {
          message:
            "Votre compte n'est pas encore activé, veuillez contacter un admin pour l'activation.",
        },
        { status: 401 }
      );
    }

    // Préparer les données de session
    const userRoles = user.roles.map((role) => role.name);

    // Extraire toutes les permissions des rôles de l'utilisateur
    // Avec la relation implicite, permissions est un tableau direct
    const userPermissions = user.roles.flatMap((role) =>
      role.permissions.map((permission) => ({
        id: permission.id,
        resource: permission.resource,
        action: permission.action,
        roleId: role.id,
        roleName: role.name,
      }))
    );

    // SESSION
    const session = await getSession();
    session.userId = user.id;
    session.email = user.email;
    session.name = user.name; // Ajout du nom dans la session
    session.roles = userRoles;
    session.permissions = userPermissions; // Stocker les permissions dans la session
    session.isLoggedIn = true;
    await session.save();

    // Supprimer le mot de passe avant de renvoyer l'utilisateur
    const { password: _, ...sanitizedUser } = user;

    // Formater la réponse avec les données structurées
    const userResponse = {
      ...sanitizedUser,
      // Ajouter les permissions dans la réponse pour le frontend
      permissions: userPermissions,
      // Liste des noms de rôles pour faciliter les vérifications
      roleNames: userRoles,
    };

    return NextResponse.json({ user: userResponse }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
