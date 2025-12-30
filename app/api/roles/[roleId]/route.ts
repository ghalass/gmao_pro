import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  protectDeleteRoute,
  protectReadRoute,
  protectUpdateRoute,
} from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "role";

// GET - Récupérer un rôle spécifique
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ roleId: string }> }
) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { roleId } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        entrepriseId,
      },
      include: {
        permissions: true,
        entreprise: true,
      },
    });

    if (!role) {
      return NextResponse.json({ message: "Rôle non trouvé" }, { status: 404 });
    }

    return NextResponse.json(role);
  } catch (error) {
    console.error("Error fetching role:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération du rôle" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour un rôle
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ roleId: string }> }
) {
  try {
    const protectionError = await protectUpdateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { roleId } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, permissions } = body;

    const existingRole = await prisma.role.findFirst({
      where: {
        id: roleId,
        entrepriseId,
      },
      include: { permissions: true },
    });

    if (!existingRole) {
      return NextResponse.json(
        { message: "Rôle introuvable" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();

    if (permissions !== undefined) {
      if (!Array.isArray(permissions)) {
        return NextResponse.json(
          { message: "Le champ 'permissions' doit être un tableau" },
          { status: 400 }
        );
      }

      const currentPermissionIds = existingRole.permissions.map((p) => p.id);
      const newPermissionIds = permissions;

      const permissionsToAdd = newPermissionIds.filter(
        (id: string) => !currentPermissionIds.includes(id)
      );
      const permissionsToRemove = currentPermissionIds.filter(
        (id: string) => !newPermissionIds.includes(id)
      );

      updateData.permissions = {
        connect: permissionsToAdd.map((id: string) => ({ id })),
        disconnect: permissionsToRemove.map((id: string) => ({ id })),
      };
    }

    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: updateData,
      include: {
        permissions: true,
      },
    });

    return NextResponse.json(updatedRole);
  } catch (error) {
    console.error("Erreur PATCH /api/roles/[roleId]:", error);
    return NextResponse.json(
      { message: "Erreur lors de la mise à jour du rôle" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un rôle
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ roleId: string }> }
) {
  try {
    const protectionError = await protectDeleteRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { roleId } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const existingRole = await prisma.role.findFirst({
      where: {
        id: roleId,
        entrepriseId,
      },
      include: { _count: { select: { user: true } } },
    });

    if (!existingRole) {
      return NextResponse.json(
        { message: "Rôle introuvable" },
        { status: 404 }
      );
    }

    // prevent deleting role with users
    if (existingRole._count.user > 0) {
      return NextResponse.json(
        {
          message:
            "Impossible de supprimer ce rôle car il est encore attribué à des utilisateurs.",
        },
        { status: 400 }
      );
    }

    await prisma.role.delete({
      where: { id: roleId },
    });

    return NextResponse.json({
      message: "Rôle supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur DELETE /api/roles/[roleId]:", error);
    return NextResponse.json(
      { message: "Erreur lors de la suppression du rôle" },
      { status: 500 }
    );
  }
}
