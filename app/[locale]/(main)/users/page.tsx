"use client";

// app/utilisateurs/page.tsx
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
import {
  Calendar,
  CheckCircle,
  Crown,
  Mail,
  Shield,
  XCircle,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, getJoinedDate } from "@/lib/utils";
import { User, Role } from "@/lib/generated/prisma/client";
import NewUser from "./_components/new-user";
import FormError from "@/components/form/FormError";
import UserRowActions from "./_components/user-row-actions";
import { Spinner } from "@/components/ui/spinner";
import React, { useState, useEffect } from "react";

type UserWithRole = User & {
  roles: Role[];
};

const UsersPage = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = React.useState<UserWithRole[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const usersResponse = await apiFetch(API.USERS.ALL);

      if (!usersResponse.ok) {
        setError(usersResponse.data?.message || "Erreur de chargement");
        return;
      }

      setUsers(usersResponse.data || []);
    } catch (err: any) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const plural = users.length !== 1 ? "s" : "";

  return (
    <div className="mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Utilisateurs</h1>
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Spinner className="h-3 w-3" />
                <span className="text-xs">Mise à jour...</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {users.length} utilisateur{plural}
          </p>
        </div>
        <div>
          <NewUser onSuccess={fetchData} />
        </div>
      </div>

      {error && <FormError error={error} />}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date de création</TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Aucun utilisateur
                </TableCell>
              </TableRow>
            ) : (
              users?.map((currentUser: UserWithRole) => {
                return (
                  <TableRow key={currentUser.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(currentUser.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="flex items-center gap-2">
                            {currentUser.name}
                            {currentUser.isOwner && (
                              <Crown className="h-4 w-4 text-yellow-500" />
                            )}
                          </span>
                          {currentUser.isSuperAdmin && (
                            <Badge variant="outline" className="w-fit">
                              <Shield className="mr-1 h-3 w-3" />
                              Super Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {currentUser.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {currentUser.roles?.map((role, index) => (
                        <Badge key={index} variant="secondary" className="mr-1">
                          {role.name}
                        </Badge>
                      ))}
                      {(!currentUser.roles ||
                        currentUser.roles.length === 0) && (
                        <span className="text-sm text-muted-foreground">
                          Aucun rôle
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {currentUser.active ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        {currentUser.active ? "Actif" : "Inactif"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {getJoinedDate(currentUser.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="w-0 text-right">
                      <UserRowActions
                        user={currentUser}
                        onUserUpdated={fetchData}
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

export default UsersPage;
