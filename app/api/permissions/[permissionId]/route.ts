import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  protectDeleteRoute,
  protectReadRoute,
  protectUpdateRoute,
} from "@/lib/rbac/middleware";

const the_resource = "permission";

// GET - Récupérer une permission spécifique
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ permissionId: string }> }
) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { permissionId } = await context.params;

    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
      include: {
        roles: true,
        entreprise: true,
      },
    });

    if (!permission) {
      return NextResponse.json(
        { message: "Permission non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(permission);
  } catch (error) {
    console.error("Error fetching permission:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération de la permission" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour une permission
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ permissionId: string }> }
) {
  try {
    const protectionError = await protectUpdateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { permissionId } = await context.params;
    const body = await request.json();
    const { resource, action, description } = body;

    const existingPermission = await prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!existingPermission) {
      return NextResponse.json(
        { message: "Permission introuvable" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (resource !== undefined)
      updateData.resource = resource.toLowerCase().trim();
    if (action !== undefined) updateData.action = action.toLowerCase().trim();
    if (description !== undefined) updateData.description = description.trim();

    // Update name to match resource:action but prefixed with entrepriseId
    if (resource !== undefined || action !== undefined) {
      const newResource = resource || existingPermission.resource;
      const newAction = action || existingPermission.action;
      updateData.name = `${existingPermission.entrepriseId}:${newAction}:${newResource}`;
    }

    const updatedPermission = await prisma.permission.update({
      where: { id: permissionId },
      data: updateData,
    });

    return NextResponse.json(updatedPermission);
  } catch (error) {
    console.error("Erreur PATCH /api/permissions/[permissionId]:", error);
    return NextResponse.json(
      { message: "Erreur lors de la mise à jour de la permission" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une permission
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ permissionId: string }> }
) {
  try {
    const protectionError = await protectDeleteRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { permissionId } = await context.params;

    const existingPermission = await prisma.permission.findUnique({
      where: { id: permissionId },
      include: { _count: { select: { roles: true } } },
    });

    if (!existingPermission) {
      return NextResponse.json(
        { message: "Permission introuvable" },
        { status: 404 }
      );
    }

    // prevent deleting permission with roles
    if (existingPermission._count.roles > 0) {
      return NextResponse.json(
        {
          message:
            "Impossible de supprimer cette permission car elle est liée à des rôles actifs.",
        },
        { status: 400 }
      );
    }

    await prisma.permission.delete({
      where: { id: permissionId },
    });

    return NextResponse.json({
      message: "Permission supprimée avec succès",
    });
  } catch (error) {
    console.error("Erreur DELETE /api/permissions/[permissionId]:", error);
    return NextResponse.json(
      { message: "Erreur lors de la suppression de la permission" },
      { status: 500 }
    );
  }
}
