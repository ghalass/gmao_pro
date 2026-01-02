"use client";

// app/[locale]/(main)/pannes/page.tsx
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
  Wrench,
  FileSpreadsheet,
  Upload,
  ArrowLeft,
  Search,
  Plus,
  Download,
  X,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import NewPanne from "./_components/new-panne";
import PanneRowActions from "./_components/panne-row-actions";
import { PanneImport } from "./_components/PanneImport";
import { PanneUpdateImport } from "./_components/PanneUpdateImport";
import { ExportExcel } from "@/components/ui/export-excel";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import React, { useState, useEffect } from "react";
import FormError from "@/components/form/FormError";
import { usePannePermissions } from "@/hooks/usePermissions";

interface Panne {
  id: string;
  name: string;
  description: string;
  typepanneId: string;
  createdAt: string;
  updatedAt: string;
  typepanne?: {
    id: string;
    name: string;
  };
  parcs?: {
    id: string;
    name: string;
  }[];
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface PannesResponse {
  data: Panne[];
  pagination: PaginationInfo;
}

type ViewMode = "list" | "import" | "update-import";

const PannesPage = () => {
  const [pannes, setPannes] = useState<Panne[]>([]);
  const [typepannes, setTypepannes] = useState<any[]>([]);
  const [engins, setEngins] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [searchInputValue, setSearchInputValue] = useState("");

  const permissions = usePannePermissions();

  // Charger les données de référence
  const fetchReferenceData = async () => {
    try {
      const [typepannesResponse, enginsResponse] = await Promise.all([
        apiFetch(API.TYPEPANNES.ALL),
        apiFetch(API.ENGINS.ALL),
      ]);

      setTypepannes(typepannesResponse.ok ? typepannesResponse.data : []);
      setEngins(enginsResponse.ok ? enginsResponse.data : []);
    } catch (err) {
      console.error("Erreur lors du chargement des données de référence:", err);
    }
  };

  useEffect(() => {
    fetchReferenceData();
  }, []);

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

      const pannesResponse = await apiFetch(`${API.PANNES.ALL}?${params}`);

      if (!pannesResponse.ok) {
        setError(pannesResponse.data?.message || "Erreur de chargement");
        return;
      }

      const response: PannesResponse = pannesResponse.data;
      setPannes(response.data || []);
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
      return pannes.map((panne) => ({
        Nom: panne.name,
        Description: panne.description || "",
        "Type de panne": panne.typepanne?.name || "N/A",
        "Parcs associés": panne.parcs?.map((p) => p.name).join(", ") || "Aucun",
        "Date de création": new Date(panne.createdAt).toLocaleDateString(
          "fr-FR"
        ),
        "Date de mise à jour": new Date(panne.updatedAt).toLocaleDateString(
          "fr-FR"
        ),
      }));
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      throw error;
    }
  };

  const handleImportComplete = (result: any) => {
    if (result.success) {
      toast.success(
        `Importation réussie: ${result.summary?.created || 0} pannes créées, ${
          result.summary?.updated || 0
        } mises à jour`
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
        } pannes mises à jour`
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

  const refreshPannes = () => {
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
                Modification de Pannes
              </h1>
              <p className="text-sm text-muted-foreground">
                Modifiez des pannes existantes en masse depuis un fichier Excel
              </p>
            </div>
          </div>
        </div>

        {/* Composant d'importation de modification */}
        <PanneUpdateImport onImportComplete={handleUpdateImportComplete} />
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
              <h1 className="text-2xl font-bold mb-2">Importation de Pannes</h1>
              <p className="text-sm text-muted-foreground">
                Importez des pannes en masse depuis un fichier Excel
              </p>
            </div>
          </div>
        </div>

        {/* Composant d'importation */}
        <PanneImport onImportComplete={handleImportComplete} />
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
            <h1 className="text-xl sm:text-2xl font-bold">Pannes</h1>
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Spinner className="h-3 w-3" />
                <span className="text-xs">Mise à jour...</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {pagination?.totalItems || 0} panne{plural} déclarée{plural}
            {pannes.length > 0 && searchTerm && (
              <span className="ml-2">
                ({pannes.length} résultat{pannes.length !== 1 ? "s" : ""} filtré
                {pannes.length !== 1 ? "s" : ""})
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {permissions.create && (
            <Button
              variant="outline"
              onClick={() => setViewMode("import")}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Importer Excel</span>
              <span className="sm:hidden">Importer</span>
            </Button>
          )}
          {permissions.update && (
            <Button
              variant="outline"
              onClick={() => setViewMode("update-import")}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Modifier Excel</span>
              <span className="sm:hidden">Modifier</span>
            </Button>
          )}
          {permissions.read && (
            <ExportExcel
              filename="pannes_filtres"
              sheetName="Pannes (filtrées)"
              onExportData={handleExportFiltered}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            />
          )}
          {permissions.create && (
            <NewPanne
              typepannes={typepannes}
              parcs={engins}
              onSuccess={refreshPannes}
            />
          )}
        </div>
      </div>

      <FormError error={error} />

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher une panne..."
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

      {/* Tableau des pannes */}
      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-32">Nom</TableHead>
              <TableHead className="min-w-36">Description</TableHead>
              <TableHead className="min-w-32 hidden sm:table-cell">
                Type
              </TableHead>
              <TableHead className="min-w-32 hidden sm:table-cell">
                Parcs associés
              </TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pannes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground italic"
                >
                  {searchTerm
                    ? "Aucune panne trouvée pour cette recherche"
                    : "Aucune panne déclarée"}
                </TableCell>
              </TableRow>
            ) : (
              pannes.map((panne: any) => (
                <TableRow key={panne.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-primary shrink-0" />
                      <span>{panne.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                      <span className="truncate max-w-xs">
                        {panne.description || "-"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary">
                      {panne.typepanne?.name || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1 max-w-50">
                      {panne.parcs && panne.parcs.length > 0 ? (
                        panne.parcs.map((p: any) => (
                          <Badge
                            key={p.id}
                            variant="outline"
                            className="text-[10px] px-1 py-0"
                          >
                            {p.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Aucun parc
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="w-0 text-right">
                    <PanneRowActions
                      panne={panne}
                      typepannes={typepannes}
                      parcs={engins}
                      onPanneUpdated={refreshPannes}
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

export default PannesPage;
