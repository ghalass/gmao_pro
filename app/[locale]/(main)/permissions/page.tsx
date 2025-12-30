// app/[locale]/(main)/permissions/page.tsx
import { API, apiFetch } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Key, ShieldCheck } from "lucide-react";
import { Permission, Role } from "@/lib/generated/prisma/client";
import NewPermission from "./_components/new-permission";
import FormError from "@/components/form/FormError";
import PermissionRowActions from "./_components/permission-row-actions";

type PermissionWithDetails = Permission & {
  roles: Role[];
};

const PermissionsPage = async () => {
  const permissionsResponse = await apiFetch(API.PERMISSIONS.ALL);

  if (!permissionsResponse.ok) {
    return <FormError error={permissionsResponse.data.message} />;
  }

  const permissions = permissionsResponse.data || [];

  return (
    <div className="mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Permissions</h1>
          <p className="text-sm text-muted-foreground">
            {permissions.length} permission{permissions.length !== 1 ? "s" : ""}{" "}
            définie{permissions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div>
          <NewPermission />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Permission</TableHead>
              <TableHead>Ressource</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Rôles liés</TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Aucune permission
                </TableCell>
              </TableRow>
            ) : (
              permissions?.map((permission: PermissionWithDetails) => {
                return (
                  <TableRow key={permission.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-primary" />
                        <span className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                          {permission.action}:{permission.resource}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {permission.resource}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {permission.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-muted-foreground text-sm max-w-[250px] truncate">
                        {permission.description || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {permission.roles?.length > 0 ? (
                          permission.roles.slice(0, 2).map((role) => (
                            <Badge
                              key={role.id}
                              variant="outline"
                              className="text-[10px]"
                            >
                              {role.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Aucun rôle
                          </span>
                        )}
                        {permission.roles?.length > 2 && (
                          <Badge variant="outline" className="text-[10px]">
                            +{permission.roles.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="w-0 text-right">
                      <PermissionRowActions permission={permission} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default PermissionsPage;
