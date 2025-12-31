"use client";

// app/[locale]/(main)/sites/page.tsx
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
  MapPin,
  Truck,
  FileSpreadsheet,
  Upload,
  ArrowLeft,
  Search,
  Filter,
  Plus,
} from "lucide-react";
import NewSite from "./_components/new-site";
import SiteRowActions from "./_components/site-row-actions";
import { SiteImport } from "./_components/SiteImport";
import { toast } from "sonner";
import React, { useState, useEffect } from "react";

interface Site {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    engins: number;
  };
}

type ViewMode = "list" | "import";

const SitesPage = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const sitesResponse = await apiFetch(API.SITES.ALL);

      if (!sitesResponse.ok) {
        setError(sitesResponse.data?.message || "Erreur de chargement");
        return;
      }

      setSites(sitesResponse.data || []);
    } catch (err: any) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  const filteredSites = sites.filter((site) =>
    site.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImportComplete = (result: any) => {
    console.log("Importation terminée:", result);

    if (result.success) {
      toast.success(
        `Importation réussie: ${result.summary?.created || 0} sites créés, ${
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

  const refreshSites = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const plural = sites.length !== 1 ? "s" : "";

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
              <h1 className="text-2xl font-bold mb-2">Importation de Sites</h1>
              <p className="text-sm text-muted-foreground">
                Importez des sites en masse depuis un fichier Excel
              </p>
            </div>
          </div>
        </div>

        {/* Composant d'importation */}
        <SiteImport onImportComplete={handleImportComplete} />
      </div>
    );
  }

  // Vue liste (par défaut)
  return (
    <div className="mx-auto p-4">
      {/* Header principal */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Sites</h1>
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Spinner className="h-3 w-3" />
                <span className="text-xs">Mise à jour...</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {sites.length} site{plural} configuré{plural}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setViewMode("import")}
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Importer Excel
          </Button>
          <NewSite onSuccess={refreshSites} />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 border border-red-200 bg-red-50 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Barre de recherche et filtres */}
      <div className="mb-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher un site..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtrer
          </Button>
        </div>
      </div>

      {/* Tableau des sites */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Engins associés</TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSites.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground italic"
                >
                  {searchTerm
                    ? "Aucun site trouvé pour cette recherche"
                    : "Aucun site configuré"}
                </TableCell>
              </TableRow>
            ) : (
              filteredSites.map((site: any) => (
                <TableRow key={site.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      {site.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={site.active ? "success" : "secondary"}>
                      {site.active ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Truck className="h-4 w-4" />
                      <span>{site._count?.engins || 0} engins</span>
                    </div>
                  </TableCell>
                  <TableCell className="w-0 text-right">
                    <SiteRowActions site={site} onSiteUpdated={refreshSites} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default SitesPage;
