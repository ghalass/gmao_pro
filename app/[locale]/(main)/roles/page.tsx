// app/roles/page.tsx
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
import { Shield, Users, Info } from "lucide-react";
import { Role, Permission, User } from "@/lib/generated/prisma/client";
import NewRole from "./_components/new-role";
import FormError from "@/components/form/FormError";
import RoleRowActions from "./_components/role-row-actions";

type RoleWithDetails = Role & {
  permissions: Permission[];
  user: User[];
};

const RolesPage = async () => {
  const rolesResponse = await apiFetch(API.ROLES.ALL);

  if (!rolesResponse.ok) {
    return <FormError error={rolesResponse.data.message} />;
  }

  const roles = rolesResponse.data || [];

  return (
    <div className="mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rôles et Permissions</h1>
          <p className="text-sm text-muted-foreground">
            {roles.length} rôle{roles.length !== 1 ? "s" : ""} configuré
            {roles.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div>
          <NewRole />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rôle</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Utilisateurs</TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Aucun rôle
                </TableCell>
              </TableRow>
            ) : (
              roles?.map((currentRole: RoleWithDetails) => {
                return (
                  <TableRow key={currentRole.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        {currentRole.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm max-w-[300px] truncate">
                        {currentRole.description || "Aucune description"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {currentRole.permissions?.length > 0 ? (
                          currentRole.permissions
                            .slice(0, 3)
                            .map((perm, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-[10px] px-1 h-5"
                              >
                                {perm.action}:{perm.resource}
                              </Badge>
                            ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Aucune permission
                          </span>
                        )}
                        {currentRole.permissions?.length > 3 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1 h-5"
                          >
                            +{currentRole.permissions.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {currentRole.user?.length || 0}
                      </div>
                    </TableCell>
                    <TableCell className="w-0 text-right">
                      <RoleRowActions role={currentRole} />
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

export default RolesPage;
