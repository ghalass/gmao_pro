// app/api/super-admin/entreprises/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Action } from "@/lib/generated/prisma/client";

type LANG = "fr" | "ar";

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

    const entreprises = await prisma.entreprise.findMany({
      include: {
        _count: {
          select: {
            users: true,
            sites: true,
            engins: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(entreprises);
  } catch (error) {
    console.error("Erreur lors de la récupération des entreprises :", error);
    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
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

    const body = await req.json();
    const { name, lang = "fr" } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { message: "Le nom de l'entreprise est requis" },
        { status: 400 }
      );
    }

    if (!["fr", "ar"].includes(lang)) {
      return NextResponse.json(
        { message: "La langue doit être 'fr' ou 'ar'" },
        { status: 400 }
      );
    }

    // Vérifier si l'entreprise existe déjà
    const existingEntreprise = await prisma.entreprise.findUnique({
      where: { name: name.trim() },
    });

    if (existingEntreprise) {
      return NextResponse.json(
        { message: "Une entreprise avec ce nom existe déjà" },
        { status: 409 }
      );
    }

    // Créer l'entreprise avec ses rôles par défaut
    const entreprise = await prisma.entreprise.create({
      data: {
        name: name.trim(),
        lang: lang as "fr" | "ar",
      },
    });

    // Créer les rôles par défaut après la création de l'entreprise
    const adminRole = await prisma.role.create({
      data: {
        name: "admin",
        description: "Administrateur de l'entreprise",
        entrepriseId: entreprise.id,
      },
    });

    const userRole = await prisma.role.create({
      data: {
        name: "user",
        description: "Utilisateur standard",
        entrepriseId: entreprise.id,
      },
    });

    // Créer les permissions pour le rôle admin
    const adminPermissions = [
      {
        name: "users:create",
        resource: "users",
        action: Action.create as any,
        entrepriseId: entreprise.id,
      },
      {
        name: "users:read",
        resource: "users",
        action: Action.read as any,
        entrepriseId: entreprise.id,
      },
      {
        name: "users:update",
        resource: "users",
        action: Action.update as any,
        entrepriseId: entreprise.id,
      },
      {
        name: "users:delete",
        resource: "users",
        action: Action.delete as any,
        entrepriseId: entreprise.id,
      },
      {
        name: "sites:create",
        resource: "sites",
        action: Action.create as any,
        entrepriseId: entreprise.id,
      },
      {
        name: "sites:read",
        resource: "sites",
        action: Action.read as any,
        entrepriseId: entreprise.id,
      },
      {
        name: "sites:update",
        resource: "sites",
        action: Action.update as any,
        entrepriseId: entreprise.id,
      },
      {
        name: "sites:delete",
        resource: "sites",
        action: Action.delete as any,
        entrepriseId: entreprise.id,
      },
      {
        name: "engins:create",
        resource: "engins",
        action: Action.create as any,
        entrepriseId: entreprise.id,
      },
      {
        name: "engins:read",
        resource: "engins",
        action: Action.read as any,
        entrepriseId: entreprise.id,
      },
      {
        name: "engins:update",
        resource: "engins",
        action: Action.update as any,
        entrepriseId: entreprise.id,
      },
      {
        name: "engins:delete",
        resource: "engins",
        action: Action.delete as any,
        entrepriseId: entreprise.id,
      },
    ];

    for (const permission of adminPermissions) {
      await prisma.permission.create({
        data: permission,
      });
    }

    // Créer les permissions pour le rôle user
    const userPermissions = [
      {
        name: "engins:read",
        resource: "engins",
        action: Action.read as any,
        entrepriseId: entreprise.id,
      },
      {
        name: "sites:read",
        resource: "sites",
        action: Action.read as any,
        entrepriseId: entreprise.id,
      },
    ];

    for (const permission of userPermissions) {
      await prisma.permission.create({
        data: permission,
      });
    }

    // Récupérer l'entreprise avec ses rôles et permissions
    const result = await prisma.entreprise.findUnique({
      where: { id: entreprise.id },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de l'entreprise :", error);
    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
