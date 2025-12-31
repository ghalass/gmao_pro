"use client";

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
import { Spinner } from "@/components/ui/spinner";
import React, { useState, useEffect } from "react";

type PermissionWithDetails = Permission & {
  roles: Role[];
};

const PermissionsPage = () => {
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = React.useState<PermissionWithDetails[]>(
    []
  );
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const permissionsResponse = await apiFetch(API.PERMISSIONS.ALL);

      if (!permissionsResponse.ok) {
        setError(permissionsResponse.data?.message || "Erreur de chargement");
        return;
      }

      setPermissions(permissionsResponse.data || []);
    } catch (err: any) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const plural = permissions.length !== 1 ? "s" : "";

  return (
    <div className="mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Permissions</h1>
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Spinner className="h-3 w-3" />
                <span className="text-xs">Mise à jour...</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {permissions.length} permission{plural} définie{plural}
          </p>
        </div>
        <div>
          <NewPermission onSuccess={fetchData} />
        </div>
      </div>

      {error && <FormError error={error} />}

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
                  Aucune permission définie
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
                      <div className="text-muted-foreground text-sm max-w-62.5 truncate">
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
                      <PermissionRowActions
                        permission={permission}
                        onPermissionUpdated={fetchData}
                      />
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
