"use client";

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
  Tractor,
  MapPin,
  Landmark,
  Clock,
  FileSpreadsheet,
  Upload,
  ArrowLeft,
  Search,
  Plus,
  Download,
  X,
} from "lucide-react";
import NewEngin from "./_components/new-engin";
import EnginRowActions from "./_components/engin-row-actions";
import { EnginImport } from "./_components/EnginImport";
import { EnginUpdateImport } from "./_components/EnginUpdateImport";
import { ExportExcel } from "@/components/ui/export-excel";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import React, { useState, useEffect } from "react";

interface Engin {
  id: string;
  name: string;
  active: boolean;
  parcId: string;
  siteId: string;
  initialHeureChassis: number | null;
  createdAt: string;
  updatedAt: string;
  parc?: {
    id: string;
    name: string;
    typeparc?: {
      id: string;
      name: string;
    } | null;
  };
  site?: {
    id: string;
    name: string;
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

interface EnginsResponse {
  data: Engin[];
  pagination: PaginationInfo;
}

type ViewMode = "list" | "import" | "update-import";

const EnginsPage = () => {
  const [engins, setEngins] = useState<Engin[]>([]);
  const [parcs, setParcs] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchInputValue, setSearchInputValue] = useState("");

  // Charger les données de référence
  const fetchReferenceData = async () => {
    try {
      const [parcsResponse, sitesResponse] = await Promise.all([
        apiFetch(API.PARCS.ALL),
        apiFetch(API.SITES.ALL),
      ]);

      setParcs(
        parcsResponse.ok
          ? parcsResponse.data?.data || parcsResponse.data || []
          : []
      );
      setSites(
        sitesResponse.ok
          ? sitesResponse.data?.data || sitesResponse.data || []
          : []
      );
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

      const enginsResponse = await apiFetch(`${API.ENGINS.ALL}?${params}`);

      if (!enginsResponse.ok) {
        setError(enginsResponse.data?.message || "Erreur de chargement");
        return;
      }

      const response: EnginsResponse = enginsResponse.data;
      setEngins(response.data || []);
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
      return engins.map((engin) => ({
        Nom: engin.name,
        Statut: engin.active ? "Actif" : "Inactif",
        Parc: engin.parc?.name || "N/A",
        "Type de parc": engin.parc?.typeparc?.name || "N/A",
        Site: engin.site?.name || "N/A",
        "Heures initiales": engin.initialHeureChassis || 0,
        "Date de création": new Date(engin.createdAt).toLocaleDateString(
          "fr-FR"
        ),
        "Date de mise à jour": new Date(engin.updatedAt).toLocaleDateString(
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

      const response = await apiFetch(`${API.ENGINS.ALL}?${params}`);

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
        `Importation réussie: ${result.summary?.created || 0} engins créés, ${
          result.summary?.updated || 0
        } mis à jour`
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
        } engins mis à jour`
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

  const refreshEngins = () => {
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
              <h1 className="text-2xl font-bold mb-2">Modification d'Engins</h1>
              <p className="text-sm text-muted-foreground">
                Modifiez des engins existants en masse depuis un fichier Excel
              </p>
            </div>
          </div>
        </div>

        <EnginUpdateImport onImportComplete={handleUpdateImportComplete} />
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
              <h1 className="text-2xl font-bold mb-2">Importation d'Engins</h1>
              <p className="text-sm text-muted-foreground">
                Importez des engins en masse depuis un fichier Excel
              </p>
            </div>
          </div>
        </div>

        <EnginImport onImportComplete={handleImportComplete} />
      </div>
    );
  }

  // Vue liste (par défaut)
  return (
    <div className="mx-auto p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold">Engins</h1>
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Spinner className="h-3 w-3" />
                <span className="text-xs">Mise à jour...</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {pagination?.totalItems || 0} engin{plural} répertorié{plural}
            {engins.length > 0 && searchTerm && (
              <span className="ml-2">
                ({engins.length} résultat{engins.length !== 1 ? "s" : ""} filtré
                {engins.length !== 1 ? "s" : ""})
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
            filename="engins_filtres"
            sheetName="Engins (filtrés)"
            onExportData={handleExportFiltered}
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          />
          <NewEngin parcs={parcs} sites={sites} onSuccess={refreshEngins} />
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
              placeholder="Rechercher un engin..."
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
              <TableHead className="min-w-32">Nom / Code</TableHead>
              <TableHead className="min-w-32 hidden sm:table-cell">
                Parc
              </TableHead>
              <TableHead className="min-w-32 hidden sm:table-cell">
                Site actuel
              </TableHead>
              <TableHead className="min-w-20 hidden sm:table-cell">
                Statut
              </TableHead>
              <TableHead className="min-w-28 hidden sm:table-cell">
                Heures initiales
              </TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {engins.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground italic"
                >
                  {searchTerm
                    ? "Aucun engin trouvé pour cette recherche"
                    : "Aucun engin répertorié"}
                </TableCell>
              </TableRow>
            ) : (
              engins.map((engin: Engin) => (
                <TableRow key={engin.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Tractor className="h-4 w-4 text-primary" />
                      {engin.name}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">
                        {engin.parc?.name || "Non assigné"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {engin.site?.name || "Non assigné"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={engin.active ? "default" : "secondary"}>
                      {engin.active ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {engin.initialHeureChassis || 0}
                  </TableCell>
                  <TableCell className="w-0 text-right">
                    <EnginRowActions
                      engin={engin}
                      parcs={parcs}
                      sites={sites}
                      onEnginUpdated={refreshEngins}
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

export default EnginsPage;
