"use client";

// app/[locale]/(main)/entreprises/page.tsx
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
  Building,
  FileSpreadsheet,
  ArrowLeft,
  Search,
  Plus,
  Download,
  X,
} from "lucide-react";
import NewEntreprise from "./_components/new-entreprise";
import EntrepriseRowActions from "./_components/entreprise-row-actions";
import { ExportExcel } from "@/components/ui/export-excel";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import React, { useState, useEffect } from "react";
import FormError from "@/components/form/FormError";
import { useEntreprisePermissions } from "@/hooks/usePermissions";

interface Entreprise {
  id: string;
  name: string;
  lang: "fr" | "ar";
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
    sites: number;
  };
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface EntreprisesResponse {
  data: Entreprise[];
  pagination: PaginationInfo;
}

type ViewMode = "list";

const EntreprisesPage = () => {
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [searchInputValue, setSearchInputValue] = useState("");

  const permissions = useEntreprisePermissions();

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

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
      });

      const entreprisesResponse = await apiFetch(
        `${API.ENTREPRISES.ALL}?${params}`
      );

      if (!entreprisesResponse.ok) {
        setError(entreprisesResponse.data?.message || "Erreur de chargement");
        return;
      }

      const response: EntreprisesResponse = entreprisesResponse.data;
      setEntreprises(response.data || []);
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

  useEffect(() => {
    return () => {
      const handler = setTimeout(() => {}, 300);
      clearTimeout(handler);
    };
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleExportFiltered = async () => {
    try {
      return entreprises.map((entreprise) => ({
        "Nom de l'entreprise": entreprise.name,
        Langue: entreprise.lang.toUpperCase(),
        Statut: entreprise.active ? "Actif" : "Inactif",
        Utilisateurs: entreprise._count?.users || 0,
        Sites: entreprise._count?.sites || 0,
        "Date de création": new Date(entreprise.createdAt).toLocaleDateString(
          "fr-FR"
        ),
        "Date de mise à jour": new Date(
          entreprise.updatedAt
        ).toLocaleDateString("fr-FR"),
      }));
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      throw error;
    }
  };

  
  const refreshEntreprises = () => {
    setCurrentPage(1);
    setRefreshKey((prev) => prev + 1);
  };

  const plural = pagination?.totalItems !== 1 ? "s" : "";

  return (
    <div className="mx-auto p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold">Entreprises</h1>
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Spinner className="h-3 w-3" />
                <span className="text-xs">Mise à jour...</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {pagination?.totalItems || 0} entreprise{plural} configurée{plural}
            {entreprises.length > 0 && searchTerm && (
              <span className="ml-2">
                ({entreprises.length} résultat
                {entreprises.length !== 1 ? "s" : ""} filtré
                {entreprises.length !== 1 ? "s" : ""})
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <ExportExcel
            filename="entreprises_filtres"
            sheetName="Entreprises (filtrées)"
            onExportData={handleExportFiltered}
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          />

          {permissions.create && (
            <NewEntreprise onSuccess={refreshEntreprises} />
          )}
        </div>
      </div>

      <FormError error={error} />

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher une entreprise..."
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
              <TableHead className="min-w-36">Nom</TableHead>
              <TableHead className="min-w-24">Langue</TableHead>
              <TableHead className="min-w-24">Statut</TableHead>
              <TableHead className="min-w-28 hidden sm:table-cell">
                Utilisateurs
              </TableHead>
              <TableHead className="min-w-28 hidden sm:table-cell">
                Sites
              </TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entreprises.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground italic"
                >
                  {!permissions.read ? (
                    <FormError error={error} />
                  ) : searchTerm ? (
                    "Aucune entreprise trouvée pour cette recherche"
                  ) : (
                    "Aucune entreprise configurée"
                  )}
                </TableCell>
              </TableRow>
            ) : (
              entreprises.map((entreprise: any) => (
                <TableRow key={entreprise.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">{entreprise.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {entreprise.lang.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={entreprise.active ? "success" : "secondary"}
                    >
                      {entreprise.active ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <span>{entreprise._count?.users || 0} utilisateurs</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <span>{entreprise._count?.sites || 0} sites</span>
                    </div>
                  </TableCell>
                  <TableCell className="w-0 text-right">
                    <EntrepriseRowActions
                      entreprise={entreprise}
                      onEntrepriseUpdated={refreshEntreprises}
                    />
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

export default EntreprisesPage;
