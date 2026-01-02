import { useMemo } from "react";
import { useUser } from "@/context/UserContext";
import { can } from "@/lib/rbac/permissions";
import { Permission } from "@/lib/types";

export interface ResourcePermissions {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

export function usePermissions(resource: string): ResourcePermissions {
  const { user } = useUser();
  const userRoles = user?.roleNames || [];
  const userPermissions = user?.permissions || [];

  // Transformer les permissions du format UserDetail vers le format attendu par la fonction can
  const transformedPermissions = userPermissions.map((perm: Permission) => ({
    id: perm.id,
    resource: perm.resource,
    action: perm.action || null,
    roleId: "", // Non disponible dans ce format
    roleName: "", // Non disponible dans ce format
  }));

  return useMemo(
    () => ({
      read: can(userRoles, transformedPermissions, `${resource}:read`),
      create: can(userRoles, transformedPermissions, `${resource}:create`),
      update: can(userRoles, transformedPermissions, `${resource}:update`),
      delete: can(userRoles, transformedPermissions, `${resource}:delete`),
    }),
    [userRoles, transformedPermissions, resource]
  );
}

// Hook spécialisé pour chaque ressource
export function useSitePermissions() {
  return usePermissions("site");
}

export function useUserPermissions() {
  return usePermissions("user");
}

export function useRolePermissions() {
  return usePermissions("role");
}

export function useEnginPermissions() {
  return usePermissions("engin");
}

export function useParcPermissions() {
  return usePermissions("parc");
}

export function useLubrifiantPermissions() {
  return usePermissions("lubrifiant");
}

export function usePannePermissions() {
  return usePermissions("panne");
}

export function useOrganePermissions() {
  return usePermissions("organe");
}

export function useObjectifPermissions() {
  return usePermissions("objectif");
}

export function useTypeparcPermissions() {
  return usePermissions("typeparc");
}

export function useTypepannePermissions() {
  return usePermissions("typepanne");
}

export function useTypelubrifiantPermissions() {
  return usePermissions("typelubrifiant");
}

export function useTypeconsommationlubPermissions() {
  return usePermissions("typeconsommationlub");
}

export function usePermissionPermissions() {
  return usePermissions("permission");
}
