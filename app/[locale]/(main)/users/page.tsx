"use client";

// app/[locale]/(main)/users/page.tsx
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Calendar,
  CheckCircle,
  Crown,
  Mail,
  Shield,
  XCircle,
  FileSpreadsheet,
  Upload,
  ArrowLeft,
  Search,
  Plus,
  Download,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, getJoinedDate } from "@/lib/utils";
import { User, Role } from "@/lib/generated/prisma/client";
import NewUser from "./_components/new-user";
import UserRowActions from "./_components/user-row-actions";
import { UserImport } from "./_components/UserImport";
import { UserUpdateImport } from "./_components/UserUpdateImport";
import { ExportExcel } from "@/components/ui/export-excel";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import React, { useState, useEffect } from "react";

interface UserWithRole extends User {
  roles: Role[];
  entreprise?: {
    id: string;
    name: string;
  } | null;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface UsersResponse {
  data: UserWithRole[];
  pagination: PaginationInfo;
}

type ViewMode = "list" | "import" | "update-import";

const UsersPage = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchInputValue, setSearchInputValue] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInputValue !== searchTerm) {
        setSearchTerm(searchInputValue);
        setCurrentPage(1);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInputValue, searchTerm]);

  const handleSearchChange = (value: string) => {
    setSearchInputValue(value);
  };

  const handleClearSearch = () => {
    setSearchInputValue("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Construire l'URL avec les paramètres de pagination et de recherche
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
      });

      const usersResponse = await apiFetch(`${API.USERS.ALL}?${params}`);

      if (!usersResponse.ok) {
        setError(usersResponse.data?.message || "Erreur de chargement");
        return;
      }

      const response: UsersResponse = usersResponse.data;
      setUsers(response.data || []);
      setPagination(response.pagination || null);
    } catch (err: any) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey, currentPage, searchTerm, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleExportFiltered = async () => {
    try {
      return users.map((user) => ({
        Nom: user.name,
        Email: user.email,
        Statut: user.active ? "Actif" : "Inactif",
        Propriétaire: user.isOwner ? "Oui" : "Non",
        "Super Admin": user.isSuperAdmin ? "Oui" : "Non",
        Entreprise: user.entreprise?.name || "N/A",
        Rôles: user.roles.map((r) => r.name).join(", ") || "Aucun",
        "Date de création": new Date(user.createdAt).toLocaleDateString(
          "fr-FR"
        ),
        "Date de mise à jour": new Date(user.updatedAt).toLocaleDateString(
          "fr-FR"
        ),
      }));
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      throw error;
    }
  };

  const handleExportAll = async () => {
    try {
      const params = new URLSearchParams({
        limit: "-1",
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await apiFetch(`${API.USERS.ALL}?${params}`);

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des données");
      }

      const allData = response.data?.data || [];
      return allData;
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      throw error;
    }
  };

  const handleImportComplete = (result: any) => {
    console.log("Importation terminée:", result);

    if (result.success) {
      toast.success(
        `Importation réussie: ${
          result.summary?.created || 0
        } utilisateurs créés, ${result.summary?.updated || 0} mis à jour`
      );
      setTimeout(() => {
        setViewMode("list");
        setRefreshKey((prev) => prev + 1);
      }, 2000);
    } else {
      toast.error(
        `Importation partielle: ${result.summary?.errors || 0} erreurs`
      );
    }
  };

  const handleUpdateImportComplete = (result: any) => {
    console.log("Modification par importation terminée:", result);

    if (result.success) {
      toast.success(
        `Modification réussie: ${
          result.summary?.updated || 0
        } utilisateurs mis à jour`
      );
      setTimeout(() => {
        setViewMode("list");
        setRefreshKey((prev) => prev + 1);
      }, 2000);
    } else {
      toast.error(
        `Modification partielle: ${result.summary?.errors || 0} erreurs`
      );
    }
  };

  const refreshUsers = () => {
    setCurrentPage(1);
    setRefreshKey((prev) => prev + 1);
  };

  const plural = pagination?.totalItems !== 1 ? "s" : "";

  // Vue importation de modification
  if (viewMode === "update-import") {
    return (
      <div className="mx-auto p-4">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setViewMode("list")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                Modification d'Utilisateurs
              </h1>
              <p className="text-sm text-muted-foreground">
                Modifiez des utilisateurs existants en masse depuis un fichier
                Excel
              </p>
            </div>
          </div>
        </div>

        <UserUpdateImport onImportComplete={handleUpdateImportComplete} />
      </div>
    );
  }

  // Vue importation
  if (viewMode === "import") {
    return (
      <div className="mx-auto p-4">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setViewMode("list")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                Importation d'Utilisateurs
              </h1>
              <p className="text-sm text-muted-foreground">
                Importez des utilisateurs en masse depuis un fichier Excel
              </p>
            </div>
          </div>
        </div>

        <UserImport onImportComplete={handleImportComplete} />
      </div>
    );
  }

  // Vue liste (par défaut)
  return (
    <div className="mx-auto p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold">Utilisateurs</h1>
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Spinner className="h-3 w-3" />
                <span className="text-xs">Mise à jour...</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {pagination?.totalItems || 0} utilisateur{plural} répertorié{plural}
            {users.length > 0 && searchTerm && (
              <span className="ml-2">
                ({users.length} résultat{users.length !== 1 ? "s" : ""} filtré
                {users.length !== 1 ? "s" : ""})
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setViewMode("import")}
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Importer Excel</span>
            <span className="sm:hidden">Importer</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setViewMode("update-import")}
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Modifier Excel</span>
            <span className="sm:hidden">Modifier</span>
          </Button>
          <ExportExcel
            filename="utilisateurs_filtres"
            sheetName="Utilisateurs (filtrés)"
            onExportData={handleExportFiltered}
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          />
          <NewUser onSuccess={refreshUsers} />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 border border-red-200 bg-red-50 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher un utilisateur..."
              value={searchInputValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearSearch}
          disabled={!searchInputValue}
          className="flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <X className="h-4 w-4" />
          <span className="hidden sm:inline">Effacer le filtre</span>
          <span className="sm:hidden">Effacer</span>
        </Button>
      </div>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-48">Utilisateur</TableHead>
              <TableHead className="min-w-32 hidden sm:table-cell">
                Statut
              </TableHead>
              <TableHead className="min-w-24 hidden sm:table-cell">
                Rôles
              </TableHead>
              <TableHead className="min-w-28 hidden sm:table-cell">
                Permissions
              </TableHead>
              <TableHead className="min-w-28 hidden sm:table-cell">
                Date d'inscription
              </TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground italic"
                >
                  {searchTerm
                    ? "Aucun utilisateur trouvé pour cette recherche"
                    : "Aucun utilisateur répertorié"}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user: UserWithRole) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      {user.active ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">
                        {user.active ? "Actif" : "Inactif"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        {user.isOwner && (
                          <Badge variant="default" className="text-xs">
                            <Crown className="h-3 w-3 mr-1" />
                            Propriétaire
                          </Badge>
                        )}
                        {user.isSuperAdmin && (
                          <Badge variant="destructive" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Super Admin
                          </Badge>
                        )}
                      </div>
                      {user.roles.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <Badge
                              key={role.id}
                              variant="secondary"
                              className="text-xs"
                            >
                              {role.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {user.roles.length} rôle
                      {user.roles.length !== 1 ? "s" : ""}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {getJoinedDate(user.createdAt)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="w-0 text-right">
                    <UserRowActions user={user} onUserUpdated={refreshUsers} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {pagination && (
        <div className="mt-4">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            totalItems={pagination.totalItems}
            className="flex-col sm:flex-row items-center justify-between gap-4"
          />
        </div>
      )}
    </div>
  );
};

export default UsersPage;
