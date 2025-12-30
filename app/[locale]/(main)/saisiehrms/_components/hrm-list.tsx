"use client";

import { API, apiFetch, methods } from "@/lib/api";
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
import {
  Calendar,
  Settings,
  Activity,
  MapPin,
  Clock,
  Hash,
  Search,
  RotateCcw,
} from "lucide-react";
import { getJoinedDate } from "@/lib/utils";
import {
  Saisiehrm,
  Engin,
  Site,
  Parc,
  Typeparc,
} from "@/lib/generated/prisma/client";
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import SaisiehrmRowActions from "./saisiehrm-row-actions";
import { toast } from "sonner";

type SaisiehrmWithRelations = Saisiehrm & {
  engin: Engin & { parc: Parc & { typeparc: Typeparc } };
  site: Site;
  _count: { saisiehim: number };
};

const HrmList = () => {
  const [saisiehrms, setSaisiehrms] = useState<SaisiehrmWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Filter states
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedTypeparcId, setSelectedTypeparcId] = useState("ALL");
  const [selectedParcId, setSelectedParcId] = useState("ALL");
  const [selectedSiteId, setSelectedSiteId] = useState("ALL");
  const [selectedEnginId, setSelectedEnginId] = useState("ALL");

  // Options for selects
  const [typeparcs, setTypeparcs] = useState<Typeparc[]>([]);
  const [parcs, setParcs] = useState<Parc[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [engins, setEngins] = useState<Engin[]>([]);

  const fetchFiltersData = useCallback(async () => {
    try {
      const [tpRes, pRes, sRes, eRes] = await Promise.all([
        apiFetch(API.TYPEPARCS.ALL),
        apiFetch(API.PARCS.ALL),
        apiFetch(API.SITES.ALL),
        apiFetch(API.ENGINS.ALL),
      ]);

      if (tpRes.ok) setTypeparcs(tpRes.data);
      if (pRes.ok) setParcs(pRes.data);
      if (sRes.ok) setSites(sRes.data);
      if (eRes.ok) setEngins(eRes.data);
    } catch (error) {
      console.error("Error fetching filters data:", error);
    }
  }, []);

  const fetchHrms = useCallback(
    async (isReset = false) => {
      try {
        setLoading(true);
        const params = new URLSearchParams();

        if (!isReset) {
          if (fromDate) params.append("from", fromDate);
          if (toDate) params.append("to", toDate);
          if (selectedSiteId !== "ALL") params.append("siteId", selectedSiteId);
          if (selectedTypeparcId !== "ALL")
            params.append("typeparcId", selectedTypeparcId);
          if (selectedParcId !== "ALL") params.append("parcId", selectedParcId);
          if (selectedEnginId !== "ALL")
            params.append("enginId", selectedEnginId);
        }

        const response = await apiFetch(
          `${API.SAISIEHRMS.ALL}?${params.toString()}`
        );
        if (response.ok) {
          setSaisiehrms(response.data);
        } else {
          toast.error("Erreur lors du chargement des données");
        }
      } catch (error) {
        console.error(error);
        toast.error("Une erreur est survenue");
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [
      fromDate,
      toDate,
      selectedSiteId,
      selectedTypeparcId,
      selectedParcId,
      selectedEnginId,
    ]
  );

  useEffect(() => {
    fetchFiltersData();
    // Initial fetch to show data on page load?
    // The user said "ne charger les données que si je choisi clique sur un boutton"
    // So let's NOT load data initially, or maybe load all once.
    // Actually "Option d'afficher tout" and "ne charger que sur clic"
    // suggests maybe a blank state or initial all.
    // Let's go with minimal initial load or wait for button.
    setInitialLoading(false);
  }, [fetchFiltersData]);

  const handleReset = () => {
    setFromDate("");
    setToDate("");
    setSelectedTypeparcId("ALL");
    setSelectedParcId("ALL");
    setSelectedSiteId("ALL");
    setSelectedEnginId("ALL");
    fetchHrms(true);
  };

  // Filter options for cascading
  const filteredParcs = parcs.filter(
    (p) => selectedTypeparcId === "ALL" || p.typeparcId === selectedTypeparcId
  );
  const filteredEngins = engins.filter((e) => {
    const siteMatch = selectedSiteId === "ALL" || e.siteId === selectedSiteId;
    const parcMatch = selectedParcId === "ALL" || e.parcId === selectedParcId;
    return siteMatch && parcMatch;
  });

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-muted/30">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end font-medium">
          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Du
            </Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Au
            </Label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Site
            </Label>
            <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Tous les sites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les sites</SelectItem>
                {sites.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground flex items-center gap-1">
              <Settings className="h-3 w-3" /> Type Parc
            </Label>
            <Select
              value={selectedTypeparcId}
              onValueChange={(val) => {
                setSelectedTypeparcId(val);
                setSelectedParcId("ALL");
                setSelectedEnginId("ALL");
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les types</SelectItem>
                {typeparcs.map((tp) => (
                  <SelectItem key={tp.id} value={tp.id}>
                    {tp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground flex items-center gap-1">
              <Settings className="h-3 w-3" /> Parc
            </Label>
            <Select
              value={selectedParcId}
              onValueChange={(val) => {
                setSelectedParcId(val);
                setSelectedEnginId("ALL");
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Tous les parcs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les parcs</SelectItem>
                {filteredParcs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground flex items-center gap-1">
              <Activity className="h-3 w-3" /> Engin
            </Label>
            <Select value={selectedEnginId} onValueChange={setSelectedEnginId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Tous les engins" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les engins</SelectItem>
                {filteredEngins.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 lg:col-span-2">
            <Button
              className="flex-1 h-9 shadow-sm"
              onClick={() => fetchHrms()}
              disabled={loading}
            >
              {loading ? (
                <Spinner className="h-4 w-4 mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Rechercher
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={handleReset}
              disabled={loading}
              title="Réinitialiser"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Engin</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>HRM</TableHead>
              <TableHead>Compteur</TableHead>
              <TableHead>HIM</TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Spinner />
                    <span className="text-muted-foreground text-sm">
                      Chargement des données...
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : saisiehrms.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  {initialLoading
                    ? "Cliquez sur Rechercher pour charger les données."
                    : "Aucune saisie HRM trouvée pour ces filtres."}
                </TableCell>
              </TableRow>
            ) : (
              saisiehrms.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {getJoinedDate(item.du)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 font-medium">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        {item.engin?.name}
                      </div>
                      <span className="text-[10px] text-muted-foreground ml-6">
                        {item.engin?.parc?.typeparc?.name} /{" "}
                        {item.engin?.parc?.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {item.site?.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {item.hrm} hrs
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      {item.compteur !== null ? item.compteur : "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item._count?.saisiehim > 0 ? (
                      <Badge variant="secondary">
                        <Activity className="mr-1 h-3 w-3" />
                        {item._count.saisiehim} HIM
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="w-0 text-right">
                    <SaisiehrmRowActions saisiehrm={item} />
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

export default HrmList;
