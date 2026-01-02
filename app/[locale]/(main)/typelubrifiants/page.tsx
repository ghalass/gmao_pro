"use client";

// app/[locale]/(main)/typelubrifiants/page.tsx
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
  Droplets,
  FileSpreadsheet,
  ArrowLeft,
  Search,
  Plus,
  X,
  Calendar,
} from "lucide-react";
import NewTypelubrifiant from "./_components/new-typelubrifiant";
import TypelubrifiantRowActions from "./_components/typelubrifiant-row-actions";
import { TypelubrifiantImport } from "./_components/TypelubrifiantImport";
import { TypelubrifiantUpdateImport } from "./_components/TypelubrifiantUpdateImport";
import { ExportExcel } from "@/components/ui/export-excel";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import React, { useState, useEffect } from "react";
import FormError from "@/components/form/FormError";

interface Typelubrifiant {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    lubrifiants: number;
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

interface TypelubrifiantsResponse {
  data: Typelubrifiant[];
  pagination: PaginationInfo;
}

type ViewMode = "list" | "import" | "update-import";

const TypelubrifiantsPage = () => {
  const [typelubrifiants, setTypelubrifiants] = useState<Typelubrifiant[]>([]);
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
        setCurrentPage(1); // Réinitialiser à la première page lors de la recherche
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

      const typelubrifiantsResponse = await apiFetch(
        `${API.TYPELUBRIFIANTS.ALL}?${params}`
      );

      if (!typelubrifiantsResponse.ok) {
        setError(
          typelubrifiantsResponse.data?.message || "Erreur de chargement"
        );
        return;
      }

      const response: TypelubrifiantsResponse = typelubrifiantsResponse.data;
      setTypelubrifiants(response.data || []);
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
    // Nettoyer le debounce lors du démontage
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
    setCurrentPage(1); // Réinitialiser à la première page
  };

  const handleExportFiltered = async () => {
    try {
      // Exporter les données actuellement affichées (filtrées) avec toutes les colonnes du tableau
      return typelubrifiants.map((typelubrifiant) => ({
        "Nom du type de lubrifiant": typelubrifiant.name,
        "Lubrifiants associés": typelubrifiant._count?.lubrifiants || 0,
        "Date de création": new Date(
          typelubrifiant.createdAt
        ).toLocaleDateString("fr-FR"),
        "Date de mise à jour": new Date(
          typelubrifiant.updatedAt
        ).toLocaleDateString("fr-FR"),
      }));
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      throw error;
    }
  };

  const handleImportComplete = (result: any) => {
    if (result.success) {
      toast.success(
        `Importation réussie: ${
          result.summary?.created || 0
        } types de lubrifiants créés, ${
          result.summary?.updated || 0
        } mis à jour`
      );
      // Retour automatique à la liste après succès
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
    if (result.success) {
      toast.success(
        `Modification réussie: ${
          result.summary?.updated || 0
        } types de lubrifiants mis à jour`
      );
      // Retour automatique à la liste après succès
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

  const refreshTypelubrifiants = () => {
    setCurrentPage(1); // Réinitialiser à la première page
    setRefreshKey((prev) => prev + 1);
  };

  const plural = pagination?.totalItems !== 1 ? "s" : "";

  // Vue importation de modification
  if (viewMode === "update-import") {
    return (
      <div className="mx-auto p-4">
        {/* Header avec navigation */}
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
                Modification de Types de Lubrifiants
              </h1>
              <p className="text-sm text-muted-foreground">
                Modifiez des types de lubrifiants existants en masse depuis un
                fichier Excel
              </p>
            </div>
          </div>
        </div>

        {/* Composant d'importation de modification */}
        <TypelubrifiantUpdateImport
          onImportComplete={handleUpdateImportComplete}
        />
      </div>
    );
  }

  // Vue importation
  if (viewMode === "import") {
    return (
      <div className="mx-auto p-4">
        {/* Header avec navigation */}
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
                Importation de Types de Lubrifiants
              </h1>
              <p className="text-sm text-muted-foreground">
                Importez des types de lubrifiants en masse depuis un fichier
                Excel
              </p>
            </div>
          </div>
        </div>

        {/* Composant d'importation */}
        <TypelubrifiantImport onImportComplete={handleImportComplete} />
      </div>
    );
  }

  // Vue liste (par défaut)
  return (
    <div className="mx-auto p-4 space-y-4">
      {/* Header principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold">
              Types de Lubrifiants
            </h1>
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Spinner className="h-3 w-3" />
                <span className="text-xs">Mise à jour...</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {pagination?.totalItems || 0} type{plural} de lubrifiant{plural}{" "}
            configuré{plural}
            {typelubrifiants.length > 0 && searchTerm && (
              <span className="ml-2">
                ({typelubrifiants.length} résultat
                {typelubrifiants.length !== 1 ? "s" : ""} filtré
                {typelubrifiants.length !== 1 ? "s" : ""})
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
            filename="typelubrifiants_filtres"
            sheetName="Types de Lubrifiants (filtrés)"
            onExportData={handleExportFiltered}
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          />
          <NewTypelubrifiant onSuccess={refreshTypelubrifiants} />
        </div>
      </div>

      <FormError error={error} />

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher un type de lubrifiant..."
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

      {/* Tableau des types de lubrifiants */}
      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-36">Nom</TableHead>
              <TableHead className="min-w-28 hidden sm:table-cell">
                Lubrifiants associés
              </TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {typelubrifiants.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="h-24 text-center text-muted-foreground italic"
                >
                  {searchTerm
                    ? "Aucun type de lubrifiant trouvé pour cette recherche"
                    : "Aucun type de lubrifiant configuré"}
                </TableCell>
              </TableRow>
            ) : (
              typelubrifiants.map((typelubrifiant: any) => (
                <TableRow key={typelubrifiant.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">{typelubrifiant.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Droplets className="h-4 w-4 shrink-0" />
                      <span>
                        {typelubrifiant._count?.lubrifiants || 0} lubrifiant
                        {typelubrifiant._count?.lubrifiants !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="w-0 text-right">
                    <TypelubrifiantRowActions
                      typelubrifiant={typelubrifiant}
                      onTypelubrifiantUpdated={refreshTypelubrifiants}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
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

export default TypelubrifiantsPage;
