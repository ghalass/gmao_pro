// auth/permissions.ts
type Role =
  | { id: string; name: string; permissions: any[] }[]
  | string[]
  | null;

export function hasAnyRole(
  userRoles?: Role,

  allowedRoles?: string[]
): boolean {
  if (!userRoles?.length || !allowedRoles?.length) return false;

  // Handle both string arrays and object arrays
  let roleNames: string[];

  if (typeof userRoles[0] === "string") {
    // If it's a string array, use it directly
    roleNames = userRoles as string[];
  } else {
    // If it's an object array, extract names
    roleNames = (
      userRoles as { id: string; name: string; permissions: any[] }[]
    ).map((role) => role.name);
  }

  return allowedRoles.some((role) => roleNames.includes(role));
}

type Permissions = {
  id: string;
  resource: string;
  action: string | null;
  roleId: string;
  roleName: string;
}[];

export function can(
  userRoles: Role,
  // allowedRoles: string[],
  permissions?: Permissions,
  requiredPermission?: string
) {
  // give admin and super admin full access
  if (hasAnyRole(userRoles, ["admin", "super admin"])) return true;

  // if (!hasAnyRole(userRoles, allowedRoles)) return false;

  // If no specific permission is required, allow access
  // Otherwise, check if the required permission exists in user's permissions
  if (
    requiredPermission &&
    !permissions?.some(
      (p) => `${p.resource}:${p.action}` === requiredPermission
    )
  ) {
    return false;
  }
  return true;
}
