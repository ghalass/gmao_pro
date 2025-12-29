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
  Plus,
  Shield,
  XCircle,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, getJoinedDate } from "@/lib/utils";
import EditUser from "./_components/edit-user";
import { User, Role } from "@/lib/generated/prisma/client";
import { Button } from "@/components/ui/button";
import NewUser from "./_components/new-user";

type UserWithRole = User & {
  roles: Role[];
};

const UsersPage = async () => {
  const usersResponse = await apiFetch(API.USERS.ALL);

  const users = usersResponse.data || [];

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground">
            {users.length} utilisateur{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div>
          <NewUser />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date création</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-muted-foreground">Aucun utilisateur</p>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user: UserWithRole, index: number) => {
                return (
                  <TableRow key={index} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{user.name}</p>
                            {user.isOwner && (
                              <Crown className="h-3 w-3 text-amber-500" />
                            )}
                          </div>
                          {user.isSuperAdmin && (
                            <Badge
                              variant="outline"
                              className="text-xs mt-1 border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300"
                            >
                              Super Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{user.email}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {user.roles?.length > 0 ? (
                        <Badge variant="outline" className="text-xs">
                          <Shield className="mr-1 h-3 w-3" />
                          {user.roles[0].name}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={user.active ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {user.active ? (
                          <CheckCircle className="mr-1 h-3 w-3" />
                        ) : (
                          <XCircle className="mr-1 h-3 w-3" />
                        )}
                        {user.active ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {getJoinedDate(user.createdAt)}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <EditUser user={user} />
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
