"use client";

// app/[locale]/(main)/objectifs/page.tsx
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
  Target,
  Building2,
  Landmark,
  FileSpreadsheet,
  Upload,
  ArrowLeft,
  Search,
  Plus,
  Download,
  X,
} from "lucide-react";
import NewObjectif from "./_components/new-objectif";
import ObjectifRowActions from "./_components/objectif-row-actions";
import { ObjectifImport } from "./_components/ObjectifImport";
import { ObjectifUpdateImport } from "./_components/ObjectifUpdateImport";
import { ExportExcel } from "@/components/ui/export-excel";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import React, { useState, useEffect } from "react";
import FormError from "@/components/form/FormError";

type ObjectifWithRelations = {
  id: string;
  annee: number;
  parcId: string;
  siteId: string;
  dispo: number | null;
  mtbf: number | null;
  tdm: number | null;
  spe_huile: number | null;
  spe_go: number | null;
  spe_graisse: number | null;
  createdAt: string;
  updatedAt: string;
  parc: {
    id: string;
    name: string;
    typeparc?: {
      id: string;
      name: string;
    } | null;
  };
  site: {
    id: string;
    name: string;
  };
};

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface ObjectifsResponse {
  data: ObjectifWithRelations[];
  pagination: PaginationInfo;
}

type ViewMode = "list" | "import" | "update-import";

const ObjectifsPage = () => {
  const [objectifs, setObjectifs] = useState<ObjectifWithRelations[]>([]);
  const [parcs, setParcs] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [typeparcs, setTypeparcs] = useState<any[]>([]);
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
      const [parcsResponse, sitesResponse, typeparcsResponse] =
        await Promise.all([
          apiFetch(API.PARCS.ALL),
          apiFetch(API.SITES.ALL),
          apiFetch(API.TYPEPARCS.ALL),
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
      setTypeparcs(
        typeparcsResponse.ok
          ? typeparcsResponse.data?.data || typeparcsResponse.data || []
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

      const objectifsResponse = await apiFetch(
        `${API.OBJECTIFS.ALL}?${params}`
      );

      if (!objectifsResponse.ok) {
        setError(objectifsResponse.data?.message || "Erreur de chargement");
        return;
      }

      const response: ObjectifsResponse = objectifsResponse.data;
      setObjectifs(response.data || []);
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
      return objectifs.map((objectif) => ({
        Année: objectif.annee,
        Parc: objectif.parc?.name || "N/A",
        "Type de parc": objectif.parc?.typeparc?.name || "N/A",
        Site: objectif.site?.name || "N/A",
        Dispo: objectif.dispo || "-",
        MTBF: objectif.mtbf || "-",
        TDM: objectif.tdm || "-",
        "Spécification huile": objectif.spe_huile || "-",
        "Spécification GO": objectif.spe_go || "-",
        "Spécification graisse": objectif.spe_graisse || "-",
        "Date de création": new Date(objectif.createdAt).toLocaleDateString(
          "fr-FR"
        ),
        "Date de mise à jour": new Date(objectif.updatedAt).toLocaleDateString(
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

      const response = await apiFetch(`${API.OBJECTIFS.ALL}?${params}`);

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
        `Importation réussie: ${result.summary?.created || 0} objectifs créés`
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
        } objectifs mis à jour`
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

  const refreshObjectifs = () => {
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
                Modification d'Objectifs
              </h1>
              <p className="text-sm text-muted-foreground">
                Modifiez des objectifs existants en masse depuis un fichier
                Excel
              </p>
            </div>
          </div>
        </div>

        <ObjectifUpdateImport onImportComplete={handleUpdateImportComplete} />
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
                Importation d'Objectifs
              </h1>
              <p className="text-sm text-muted-foreground">
                Importez des objectifs en masse depuis un fichier Excel
              </p>
            </div>
          </div>
        </div>

        <ObjectifImport onImportComplete={handleImportComplete} />
      </div>
    );
  }

  // Vue liste (par défaut)
  return (
    <div className="mx-auto p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold">Objectifs</h1>
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Spinner className="h-3 w-3" />
                <span className="text-xs">Mise à jour...</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {pagination?.totalItems || 0} objectif{plural} défini{plural}
            {objectifs.length > 0 && searchTerm && (
              <span className="ml-2">
                ({objectifs.length} résultat{objectifs.length !== 1 ? "s" : ""}{" "}
                filtré
                {objectifs.length !== 1 ? "s" : ""})
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
            filename="objectifs_filtres"
            sheetName="Objectifs (filtrés)"
            onExportData={handleExportFiltered}
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          />
          <NewObjectif
            parcs={parcs}
            sites={sites}
            typeparcs={typeparcs}
            onSuccess={refreshObjectifs}
          />
        </div>
      </div>

      <FormError error={error} />

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher un objectif..."
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
              <TableHead className="min-w-20">Année</TableHead>
              <TableHead className="min-w-32">Parc</TableHead>
              <TableHead className="min-w-32 hidden sm:table-cell">
                Site
              </TableHead>
              <TableHead className="min-w-20 hidden sm:table-cell">
                Dispo
              </TableHead>
              <TableHead className="min-w-20 hidden sm:table-cell">
                MTBF
              </TableHead>
              <TableHead className="min-w-20 hidden sm:table-cell">
                TDM
              </TableHead>
              <TableHead className="min-w-32 hidden lg:table-cell">
                Spécifications
              </TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {objectifs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground italic"
                >
                  {searchTerm
                    ? "Aucun objectif trouvé pour cette recherche"
                    : "Aucun objectif défini"}
                </TableCell>
              </TableRow>
            ) : (
              objectifs?.map((objectif: ObjectifWithRelations) => {
                return (
                  <TableRow key={objectif.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {objectif.annee}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Landmark className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {objectif.parc.name}
                          </div>
                          {objectif.parc.typeparc && (
                            <div className="text-xs text-muted-foreground">
                              {objectif.parc.typeparc.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {objectif.site.name}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {objectif.dispo || "-"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {objectif.mtbf || "-"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {objectif.tdm || "-"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="space-y-1 text-xs">
                        {objectif.spe_huile && (
                          <div>Huile: {objectif.spe_huile}</div>
                        )}
                        {objectif.spe_go !== null && (
                          <div>
                            <span className="text-muted-foreground">GO: </span>
                            <span className="font-medium">
                              {objectif.spe_go}
                            </span>
                          </div>
                        )}
                        {objectif.spe_graisse !== null && (
                          <div>
                            <span className="text-muted-foreground">
                              Graisse:{" "}
                            </span>
                            <span className="font-medium">
                              {objectif.spe_graisse}
                            </span>
                          </div>
                        )}
                        {objectif.spe_huile === null &&
                          objectif.spe_go === null &&
                          objectif.spe_graisse === null && (
                            <span className="text-muted-foreground">-</span>
                          )}
                      </div>
                    </TableCell>
                    <TableCell className="w-0 text-right">
                      <ObjectifRowActions
                        objectif={objectif}
                        parcs={parcs}
                        sites={sites}
                        typeparcs={typeparcs}
                        onObjectifUpdated={refreshObjectifs}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
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

export default ObjectifsPage;
