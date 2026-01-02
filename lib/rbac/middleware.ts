// lib/rbac/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { hasPermission, isAdmin, isSuperAdmin } from "./core";
import { getSession } from "../auth";

export enum ACTION {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
}

export async function protectRoute(
  request: NextRequest,
  action: string,
  resource: string
): Promise<NextResponse | null> {
  try {
    // Vérifier si l'utilisateur est admin ou super-admin
    const session = await getSession();

    if (!session.isLoggedIn)
      return NextResponse.json(
        { message: "Utilisateur non authentifié" },
        { status: 401 }
      );

    const userId = session?.userId;

    const is_Admin = await isAdmin();
    const is_SuperAdmin = await isSuperAdmin();
    const isAdminOrSuperAdmin = is_Admin || is_SuperAdmin;

    // Accès automatique pour les administrateurs et super-administrateurs
    if (isAdminOrSuperAdmin) {
      return null; // Accès autorisé pour les administrateurs
    }

    // Vérifier l'authentification de l'utilisateur, si ce n'est pas un admin ou super-admin
    if (!userId) {
      return NextResponse.json(
        { message: "Utilisateur non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier les permissions spécifiques, si ce n'est pas un admin ou super-admin
    const hasAccess = await hasPermission(userId, action, resource);

    if (!hasAccess) {
      return NextResponse.json(
        { message: `Opération non autorisée ${action}-${resource}` },
        { status: 401 }
      );
    }

    return null;
  } catch (error) {
    console.error("Error in protectRoute:", error);
    return NextResponse.json(
      {
        message: `Erreur de vérification des permissions ${action}-${resource}`,
      },
      { status: 500 }
    );
  }
}

export async function protectReadRoute(
  request: NextRequest,
  resource: string
): Promise<NextResponse | null> {
  return protectRoute(request, ACTION.READ, resource);
}

export async function protectWriteRoute(
  request: NextRequest,
  resource: string
): Promise<NextResponse | null> {
  return protectRoute(request, ACTION.UPDATE, resource);
}

export async function protectCreateRoute(
  request: NextRequest,
  resource: string
): Promise<NextResponse | null> {
  return protectRoute(request, ACTION.CREATE, resource);
}

export async function protectUpdateRoute(
  request: NextRequest,
  resource: string
): Promise<NextResponse | null> {
  return protectRoute(request, ACTION.UPDATE, resource);
}

export async function protectDeleteRoute(
  request: NextRequest,
  resource: string
): Promise<NextResponse | null> {
  return protectRoute(request, ACTION.DELETE, resource);
}
