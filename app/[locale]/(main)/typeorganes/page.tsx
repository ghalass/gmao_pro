"use client";

// app/[locale]/(main)/typeorganes/page.tsx
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
  Settings,
  Calendar,
  Package,
  FileSpreadsheet,
  Upload,
  ArrowLeft,
  Search,
  Plus,
  Download,
  X,
} from "lucide-react";
import NewTypeorgane from "./_components/new-typeorgane";
import TypeorganeRowActions from "./_components/typeorgane-row-actions";
import { TypeorganeImport } from "./_components/TypeorganeImport";
import { TypeorganeUpdateImport } from "./_components/TypeorganeUpdateImport";
import { ExportExcel } from "@/components/ui/export-excel";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import React, { useState, useEffect } from "react";
import FormError from "@/components/form/FormError";

interface Typeorgane {
  id: string;
  name: string;
  entrepriseId: string;
  parcId?: string | null;
  parc?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    organes: number;
    typeOrganeParcs: number;
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

interface TypeorganesResponse {
  data: Typeorgane[];
  pagination: PaginationInfo;
}

type ViewMode = "list" | "import" | "update-import";

const TypeorganesPage = () => {
  const [typeorganes, setTypeorganes] = useState<Typeorgane[]>([]);
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

      const typeorganesResponse = await apiFetch(
        `${API.TYPEORGANES.ALL}?${params}`
      );

      if (!typeorganesResponse.ok) {
        setError(typeorganesResponse.data?.message || "Erreur de chargement");
        return;
      }

      const response: TypeorganesResponse = typeorganesResponse.data;
      setTypeorganes(response.data || []);
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
      return typeorganes.map((typeorgane) => ({
        Nom: typeorgane.name,
        "Parc associé": typeorgane.parc?.name || "N/A",
        "Nombre d'organes": typeorgane._count?.organes || 0,
        "Nombre de parcs": typeorgane._count?.typeOrganeParcs || 0,
        "Date de création": new Date(typeorgane.createdAt).toLocaleDateString(
          "fr-FR"
        ),
        "Date de mise à jour": new Date(
          typeorgane.updatedAt
        ).toLocaleDateString("fr-FR"),
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

      const response = await apiFetch(`${API.TYPEORGANES.ALL}?${params}`);

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
        } types d'organes créés, ${result.summary?.updated || 0} mis à jour`
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
        } types d'organes mis à jour`
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

  const refreshTypeorganes = () => {
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
                Modification de Types d'Organes
              </h1>
              <p className="text-sm text-muted-foreground">
                Modifiez des types d'organes existants en masse depuis un
                fichier Excel
              </p>
            </div>
          </div>
        </div>

        <TypeorganeUpdateImport onImportComplete={handleUpdateImportComplete} />
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
                Importation de Types d'Organes
              </h1>
              <p className="text-sm text-muted-foreground">
                Importez des types d'organes en masse depuis un fichier Excel
              </p>
            </div>
          </div>
        </div>

        <TypeorganeImport onImportComplete={handleImportComplete} />
      </div>
    );
  }

  // Vue liste (par défaut)
  return (
    <div className="mx-auto p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold">Types d'Organes</h1>
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Spinner className="h-3 w-3" />
                <span className="text-xs">Mise à jour...</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {pagination?.totalItems || 0} type{plural} d'organe{plural}{" "}
            répertorié{plural}
            {typeorganes.length > 0 && searchTerm && (
              <span className="ml-2">
                ({typeorganes.length} résultat
                {typeorganes.length !== 1 ? "s" : ""} filtré
                {typeorganes.length !== 1 ? "s" : ""})
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
            filename="typeorganes_filtres"
            sheetName="Types d'Organes (filtrés)"
            onExportData={handleExportFiltered}
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          />
          <NewTypeorgane onSuccess={refreshTypeorganes} />
        </div>
      </div>

      <FormError error={error} />

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher un type d'organe..."
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
              <TableHead className="min-w-32">Nom</TableHead>
              <TableHead className="min-w-32 hidden sm:table-cell">
                Parc associé
              </TableHead>
              <TableHead className="min-w-24 hidden sm:table-cell">
                Organes
              </TableHead>
              <TableHead className="min-w-24 hidden sm:table-cell">
                Parcs
              </TableHead>
              <TableHead className="min-w-28 hidden sm:table-cell">
                Date de création
              </TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {typeorganes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground italic"
                >
                  {searchTerm
                    ? "Aucun type d'organe trouvé pour cette recherche"
                    : "Aucun type d'organe répertorié"}
                </TableCell>
              </TableRow>
            ) : (
              typeorganes.map((typeorgane: Typeorgane) => (
                <TableRow key={typeorgane.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      {typeorgane.name}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-sm">
                      {typeorgane.parc?.name || "Non assigné"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary">
                      {typeorgane._count?.organes || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline">
                      {typeorgane._count?.typeOrganeParcs || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(typeorgane.createdAt).toLocaleDateString(
                          "fr-FR"
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="w-0 text-right">
                    <TypeorganeRowActions
                      typeorgane={typeorgane}
                      onTypeorganeUpdated={refreshTypeorganes}
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

export default TypeorganesPage;
