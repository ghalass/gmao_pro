import { API, apiFetch } from "@/lib/api";
import { UserActions } from "@/components/super-admin/shared/UserActions";
import { StatusBadge } from "@/components/super-admin/shared/StatusBadge";
import SuperAdminUsersFilters from "@/components/super-admin/shared/SuperAdminUsersFilters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Users, Building2, Shield, User } from "lucide-react";
import Link from "next/link";

const SuperAdminUsersPage = async ({
  searchParams,
}: {
  searchParams: {
    page?: string;
    limit?: string;
    search?: string;
    entrepriseId?: string;
    role?: string;
    active?: string;
  };
}) => {
  const params = new URLSearchParams(
    Object.fromEntries(
      Object.entries(searchParams || {}).filter(([k]) => typeof k === "string")
    )
  );
  const usersResponse = await apiFetch(
    `${API.SUPER_ADMIN.GET_ALL_USERS}?${params.toString()}`
  );

  if (!usersResponse.ok) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">
              Erreur lors du chargement des utilisateurs
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const usersData = usersResponse.data;
  const { users, pagination, stats } = usersData;

  // Récupérer les entreprises pour le filtre
  const entreprisesResponse = await apiFetch(
    API.SUPER_ADMIN.GET_ALL_ENTREPRISES
  );
  const entreprises = entreprisesResponse.ok ? entreprisesResponse.data : [];

  return (
    <div className="bg-background">
      <div className="container mx-auto p-2 md:p-3 lg:p-4">
        {/* En-tête */}
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Gestion des Utilisateurs</h1>
              <p className="text-muted-foreground">
                Vue globale de tous les utilisateurs du système
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/super-admin/dashboard">
                  Retour au tableau de bord
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Statistiques */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Utilisateurs
                  </p>
                  <p className="text-2xl font-bold">{pagination.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Utilisateurs Actifs
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.find((s: any) => s.active)?._count || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Entreprises
                  </p>
                  <p className="text-2xl font-bold">{entreprises.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Filtres */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtres</CardTitle>
          </CardHeader>
          <CardContent>
            <SuperAdminUsersFilters entreprises={entreprises} />
          </CardContent>
        </Card>

        {/* Tableau des utilisateurs */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Rôles</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date de création</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          Aucun utilisateur trouvé
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.entreprise ? (
                            <div>
                              <p className="font-medium">
                                {user.entreprise.name}
                              </p>
                              <StatusBadge active={user.entreprise.active} />
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map((role: any) => (
                              <Badge
                                key={role.id}
                                variant="secondary"
                                className="text-xs"
                              >
                                {role.name}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge active={user.active} />
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <UserActions
                            user={user}
                            onView={() => {}}
                            onEdit={() => {}}
                            onToggleActive={() => {}}
                            onResetPassword={() => {}}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} sur {pagination.pages} (
                  {pagination.total} utilisateurs)
                </p>
                <div className="flex gap-2">
                  {pagination.page > 1 && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`?page=${pagination.page - 1}`}>
                        Précédent
                      </Link>
                    </Button>
                  )}
                  {pagination.page < pagination.pages && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`?page=${pagination.page + 1}`}>Suivant</Link>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminUsersPage;
