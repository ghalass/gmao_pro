"use client";

// app/[locale]/(main)/typepannes/page.tsx
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
  ListOrdered,
  Wrench,
  FileSpreadsheet,
  Upload,
  ArrowLeft,
  Search,
  Filter,
  Plus,
  Download,
  X,
  Calendar,
} from "lucide-react";
import NewTypepanne from "./_components/new-typepanne";
import TypepanneRowActions from "./_components/typepanne-row-actions";
import { TypepanneImport } from "./_components/TypepanneImport";
import { TypepanneUpdateImport } from "./_components/TypepanneUpdateImport";
import { ExportExcel } from "@/components/ui/export-excel";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import React, { useState, useEffect } from "react";

interface Typepanne {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    pannes: number;
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

interface TypepannesResponse {
  data: Typepanne[];
  pagination: PaginationInfo;
}

type ViewMode = "list" | "import" | "update-import";

const TypepannesPage = () => {
  const [typepannes, setTypepannes] = useState<Typepanne[]>([]);
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

      const typepannesResponse = await apiFetch(
        `${API.TYPEPANNES.ALL}?${params}`
      );

      if (!typepannesResponse.ok) {
        setError(typepannesResponse.data?.message || "Erreur de chargement");
        return;
      }

      const response: TypepannesResponse = typepannesResponse.data;
      setTypepannes(response.data || []);
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
      return typepannes.map((typepanne) => ({
        "Nom du type": typepanne.name,
        Description: typepanne.description || "",
        "Nombre de pannes": typepanne._count?.pannes || 0,
        "Date de création": new Date(typepanne.createdAt).toLocaleDateString(
          "fr-FR"
        ),
        "Date de mise à jour": new Date(typepanne.updatedAt).toLocaleDateString(
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
      // Récupérer toutes les données sans pagination
      const params = new URLSearchParams({
        limit: "-1", // Tout afficher
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await apiFetch(`${API.TYPEPANNES.ALL}?${params}`);

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
        `Importation réussie: ${result.summary?.created || 0} types créés, ${
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
    console.log("Modification par importation terminée:", result);

    if (result.success) {
      toast.success(
        `Modification réussie: ${result.summary?.updated || 0} types mis à jour`
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

  const refreshTypepannes = () => {
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
                Modification de Types de Pannes
              </h1>
              <p className="text-sm text-muted-foreground">
                Modifiez des types de pannes existants en masse depuis un
                fichier Excel
              </p>
            </div>
          </div>
        </div>

        {/* Composant d'importation de modification */}
        <TypepanneUpdateImport onImportComplete={handleUpdateImportComplete} />
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
                Importation de Types de Pannes
              </h1>
              <p className="text-sm text-muted-foreground">
                Importez des types de pannes en masse depuis un fichier Excel
              </p>
            </div>
          </div>
        </div>

        {/* Composant d'importation */}
        <TypepanneImport onImportComplete={handleImportComplete} />
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
            <h1 className="text-xl sm:text-2xl font-bold">Types de Pannes</h1>
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Spinner className="h-3 w-3" />
                <span className="text-xs">Mise à jour...</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {pagination?.totalItems || 0} type{plural} configuré{plural}
            {typepannes.length > 0 && searchTerm && (
              <span className="ml-2">
                ({typepannes.length} résultat
                {typepannes.length !== 1 ? "s" : ""} filtré
                {typepannes.length !== 1 ? "s" : ""})
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
            filename="typepannes_filtres"
            sheetName="Types de Pannes (filtrés)"
            onExportData={handleExportFiltered}
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          />
          <NewTypepanne onSuccess={refreshTypepannes} />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 border border-red-200 bg-red-50 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher un type de panne..."
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

      {/* Tableau des types de pannes */}
      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-36">Nom</TableHead>
              <TableHead className="min-w-48 hidden sm:table-cell">
                Description
              </TableHead>
              <TableHead className="min-w-28 hidden sm:table-cell">
                Pannes
              </TableHead>
              <TableHead className="min-w-28 hidden sm:table-cell">
                Date de création
              </TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {typepannes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground italic"
                >
                  {searchTerm
                    ? "Aucun type de panne trouvé pour cette recherche"
                    : "Aucun type de panne configuré"}
                </TableCell>
              </TableRow>
            ) : (
              typepannes.map((typepanne: any) => (
                <TableRow key={typepanne.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">{typepanne.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-sm text-muted-foreground truncate max-w-xs">
                      {typepanne.description || "Aucune description"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline">
                      {typepanne._count?.pannes || 0} panne
                      {(typepanne._count?.pannes || 0) !== 1 ? "s" : ""}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span>
                        {new Date(typepanne.createdAt).toLocaleDateString(
                          "fr-FR"
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="w-0 text-right">
                    <TypepanneRowActions
                      typepanne={typepanne}
                      onTypepanneUpdated={refreshTypepannes}
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

export default TypepannesPage;
