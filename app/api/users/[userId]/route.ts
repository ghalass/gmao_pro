// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
// import { userUpdateSchema } from "@/lib/validations/userSchema";
import {
  protectDeleteRoute,
  protectReadRoute,
  protectUpdateRoute,
} from "@/lib/rbac/middleware";
// import { useAuth } from "@/hooks/useAuth";
import { getSession, hashPassword } from "@/lib/auth";
import { isAdmin, isSuperAdmin } from "@/lib/rbac/core";

const the_resource = "user";

// GET - Récupérer un utilisateur spécifique
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { userId } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        entrepriseId,
      },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
        entreprise: true,
      },
      omit: { password: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération de l'utilisateur" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour un utilisateur
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const protectionError = await protectUpdateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { userId } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { name, password, roles, active } = body;

    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findFirst({
      where: {
        id: userId,
        entrepriseId,
      },
      include: {
        roles: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Validation: au moins un champ à mettre à jour
    if (
      name === undefined &&
      password === undefined &&
      roles === undefined &&
      active === undefined
    ) {
      return NextResponse.json(
        { message: "Au moins un champ à mettre à jour est requis" },
        { status: 400 }
      );
    }

    // Préparer les données de mise à jour
    const updateData: any = {};

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (active !== undefined) {
      updateData.active = Boolean(active);
    }

    // Hasher le nouveau mot de passe si fourni et non vide
    if (password !== undefined && password.trim() !== "") {
      if (password.length < 6) {
        return NextResponse.json(
          { message: "Le mot de passe doit contenir au moins 6 caractères" },
          { status: 400 }
        );
      }

      const hashedPassword = await hashPassword(password);
      updateData.password = hashedPassword;
    }

    // Gestion des rôles
    if (roles !== undefined) {
      // Vérifier que roles est un tableau
      if (!Array.isArray(roles)) {
        return NextResponse.json(
          { message: "Le champ 'roles' doit être un tableau" },
          { status: 400 }
        );
      }

      // Récupérer les rôles actuels
      const currentRoleIds = existingUser.roles.map((role) => role.id);

      // Identifier les rôles à ajouter et à retirer
      const newRoleIds = roles;
      const rolesToAdd = newRoleIds.filter(
        (roleId: string) => !currentRoleIds.includes(roleId)
      );
      const rolesToRemove = currentRoleIds.filter(
        (roleId: string) => !newRoleIds.includes(roleId)
      );

      // Vérifier que les rôles existent
      if (rolesToAdd.length > 0) {
        const existingRoles = await prisma.role.findMany({
          where: {
            id: { in: rolesToAdd },
          },
          select: { id: true },
        });

        const existingRoleIds = existingRoles.map((r) => r.id);
        const nonExistentRoles = rolesToAdd.filter(
          (roleId: string) => !existingRoleIds.includes(roleId)
        );

        if (nonExistentRoles.length > 0) {
          return NextResponse.json(
            {
              message: `Les rôles suivants n'existent pas: ${nonExistentRoles.join(
                ", "
              )}`,
            },
            { status: 400 }
          );
        }
      }

      // Préparer les opérations sur les rôles
      const roleOperations: any = {};

      if (rolesToAdd.length > 0) {
        roleOperations.connect = rolesToAdd.map((roleId: string) => ({
          id: roleId,
        }));
      }

      if (rolesToRemove.length > 0) {
        roleOperations.disconnect = rolesToRemove.map((roleId: string) => ({
          id: roleId,
        }));
      }

      // Ajouter les opérations de rôles aux données de mise à jour
      if (Object.keys(roleOperations).length > 0) {
        updateData.roles = roleOperations;
      }
    }

    // Mettre à jour l'utilisateur
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        roles: {
          select: {
            name: true,
          },
        },
        entreprise: { select: { name: true } },
      },
      omit: { password: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Erreur PATCH /api/users/[id]:", error);
    return NextResponse.json(
      {
        message: "Erreur lors de la mise à jour de l'utilisateur",
      },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un utilisateur
// DELETE - Supprimer un utilisateur
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const protectionError = await protectDeleteRoute(request, the_resource);
    if (protectionError) return protectionError;

    const currentSession = await getSession();

    const { userId } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    // Vérifier si l'utilisateur existe et appartient à l'entreprise
    const existingUser = await prisma.user.findFirst({
      where: {
        id: userId,
        entrepriseId,
      },
      include: { roles: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Seul un super-admin peut supprimer un utilisateur avec rôle admin ou super-admin
    const hasAdminRole = existingUser.roles.some(
      (role) =>
        role.name.toLowerCase() === "admin" ||
        role.name.toLowerCase() === "super-admin"
    );

    if (hasAdminRole && !currentSession?.isSuperAdmin) {
      return NextResponse.json(
        {
          message:
            "Seul un super-admin peut supprimer un utilisateur avec le rôle admin ou super-admin.",
        },
        { status: 403 }
      );
    }

    // Vérifier si l'utilisateur tente de se supprimer lui-même
    const connectedUser = currentSession?.userId;
    const toDelete_SuperAdmin = await isSuperAdmin();
    const toDelete_Admin = await isAdmin();

    // Interdire de supprimer votre propre compte
    if (connectedUser === userId) {
      return NextResponse.json(
        { message: "Vous ne pouvez pas supprimer votre propre compte." },
        { status: 400 }
      );
    }

    // Interdire aux utilisateurs non super-admin de supprimer un super-admin
    if (toDelete_SuperAdmin && !currentSession?.isSuperAdmin) {
      return NextResponse.json(
        { message: "Vous ne pouvez pas supprimer un compte d'un super admin." },
        { status: 400 }
      );
    }

    // Seul super-admin peut supprimer un admin
    if (toDelete_Admin && !currentSession?.isSuperAdmin) {
      return NextResponse.json(
        {
          message:
            "Vous ne pouvez pas supprimer un compte d'un admin, seul un super admin peut suprimer un admin.",
        },
        { status: 400 }
      );
    }

    // Supprimer l'utilisateur (les rôles seront automatiquement déconnectés)
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      message: "Utilisateur supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur DELETE /api/users/[id]:", error);

    return NextResponse.json(
      {
        message: "Erreur lors de la suppression de l'utilisateur",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
