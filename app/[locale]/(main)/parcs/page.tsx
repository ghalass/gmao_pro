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
  Landmark,
  Truck,
  FileSpreadsheet,
  Upload,
  ArrowLeft,
  Search,
  Filter,
  Plus,
  Download,
  X,
} from "lucide-react";
import NewParc from "./_components/new-parc";
import ParcRowActions from "./_components/parc-row-actions";
import { ParcImport } from "./_components/ParcImport";
import { ParcUpdateImport } from "./_components/ParcUpdateImport";
import { ExportExcel } from "@/components/ui/export-excel";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import React, { useState, useEffect } from "react";

interface Parc {
  id: string;
  name: string;
  typeparcId: string;
  createdAt: string;
  updatedAt: string;
  typeparc: {
    name: string;
  };
  _count: {
    engins: number;
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

interface ParcsResponse {
  data: Parc[];
  pagination: PaginationInfo;
}

type ViewMode = "list" | "import" | "update-import";

const ParcsPage = () => {
  const [parcs, setParcs] = useState<Parc[]>([]);
  const [typeparcs, setTypeparcs] = React.useState<any[]>([]);
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

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
      });

      const [parcsResponse, typeparcsResponse] = await Promise.all([
        apiFetch(`${API.PARCS.ALL}?${params}`),
        apiFetch(API.TYPEPARCS.ALL),
      ]);

      if (!parcsResponse.ok) {
        setError(parcsResponse.data?.message || "Erreur de chargement");
        return;
      }

      const response: ParcsResponse = parcsResponse.data;
      setParcs(response.data || []);
      setPagination(response.pagination || null);
      setTypeparcs(typeparcsResponse.ok ? typeparcsResponse.data.data : []);
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
      return parcs.map((parc) => ({
        "Nom du parc": parc.name,
        "Type de parc": parc.typeparc?.name || "Non défini",
        "Engins associés": parc._count?.engins || 0,
        "Date de création": new Date(parc.createdAt).toLocaleDateString(
          "fr-FR"
        ),
        "Date de mise à jour": new Date(parc.updatedAt).toLocaleDateString(
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

      const response = await apiFetch(`${API.PARCS.ALL}?${params}`);

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des données");
      }

      const allData = response.data?.data || [];
      return allData.map((parc: any) => ({
        "Nom du parc": parc.name,
        "Type de parc": parc.typeparc?.name || "Non défini",
        "Engins associés": parc._count?.engins || 0,
        "Date de création": new Date(parc.createdAt).toLocaleDateString(
          "fr-FR"
        ),
        "Date de mise à jour": new Date(parc.updatedAt).toLocaleDateString(
          "fr-FR"
        ),
      }));
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
        } parc(s) créé(s), ${result.summary?.updated || 0} mis à jour`
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
        } parc(s) mis à jour`
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

  const refreshParcs = () => {
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
              <h1 className="text-2xl font-bold mb-2">Modification de Parcs</h1>
              <p className="text-sm text-muted-foreground">
                Modifiez des parcs existants en masse depuis un fichier Excel
              </p>
            </div>
          </div>
        </div>

        <ParcUpdateImport onImportComplete={handleUpdateImportComplete} />
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
              <h1 className="text-2xl font-bold mb-2">Importation de Parcs</h1>
              <p className="text-sm text-muted-foreground">
                Importez des parcs en masse depuis un fichier Excel
              </p>
            </div>
          </div>
        </div>

        <ParcImport onImportComplete={handleImportComplete} />
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
            <h1 className="text-xl sm:text-2xl font-bold">Parcs</h1>
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Spinner className="h-3 w-3" />
                <span className="text-xs">Mise à jour...</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {pagination?.totalItems || 0} parc{plural} configuré{plural}
            {parcs.length > 0 && searchTerm && (
              <span className="ml-2">
                ({parcs.length} résultat{parcs.length !== 1 ? "s" : ""} filtré
                {parcs.length !== 1 ? "s" : ""})
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
            filename="parcs_filtres"
            sheetName="Parcs (filtrés)"
            onExportData={handleExportFiltered}
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          />
          <NewParc typeparcs={typeparcs} onSuccess={refreshParcs} />
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
              placeholder="Rechercher un parc..."
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

      {/* Tableau des parcs */}
      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-36">Nom</TableHead>
              <TableHead className="min-w-32">Type</TableHead>
              <TableHead className="min-w-28 hidden sm:table-cell">
                Engins associés
              </TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parcs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground italic"
                >
                  {searchTerm
                    ? "Aucun parc trouvé pour cette recherche"
                    : "Aucun parc configuré"}
                </TableCell>
              </TableRow>
            ) : (
              parcs.map((parc: any) => (
                <TableRow key={parc.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">{parc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {parc.typeparc?.name || "Non défini"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Truck className="h-4 w-4 shrink-0" />
                      <span>{parc._count?.engins || 0} engins</span>
                    </div>
                  </TableCell>
                  <TableCell className="w-0 text-right">
                    <ParcRowActions
                      parc={parc}
                      typeparcs={typeparcs}
                      onParcUpdated={refreshParcs}
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

export default ParcsPage;
