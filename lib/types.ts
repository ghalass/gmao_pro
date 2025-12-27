export interface UserDetail {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  roles: Role[];
  permissions: Permission[];
  roleNames: string[];
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  createdAt?: string; // Date en string
  updatedAt?: string; // Date en string
  permissions?: Array<{
    id: string;
    name: string;
    description: string;
    resource: string;
    action: string;
  }>;
  user?: [];
}

export interface Permission {
  id: string;
  resource: string;
  action?: Action;
  roles?: RolePermission[];
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
  role?: Role;
  permission?: Permission;
}
export enum Action {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
}
