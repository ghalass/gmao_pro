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
import { Tractor, MapPin, Landmark, Clock } from "lucide-react";
import NewEngin from "./_components/new-engin";
import FormError from "@/components/form/FormError";
import EnginRowActions from "./_components/engin-row-actions";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import React, { useState, useEffect } from "react";

const EnginsPage = () => {
  const [loading, setLoading] = useState(false);
  const [engins, setEngins] = React.useState<any[]>([]);
  const [parcs, setParcs] = React.useState<any[]>([]);
  const [sites, setSites] = React.useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [enginsResponse, parcsResponse, sitesResponse] = await Promise.all([
        apiFetch(API.ENGINS.ALL),
        apiFetch(API.PARCS.ALL),
        apiFetch(API.SITES.ALL),
      ]);

      if (!enginsResponse.ok) {
        setError(enginsResponse.data?.message);
        return;
      }

      setEngins(enginsResponse.data || []);
      setParcs(parcsResponse.ok ? parcsResponse.data : []);
      setSites(sitesResponse.ok ? sitesResponse.data : []);
    } catch (err: any) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const plural = engins.length !== 1 ? "s" : "";

  return (
    <div className="mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Engins</h1>
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Spinner className="h-3 w-3" />
                <span className="text-xs">Mise à jour...</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {engins.length} engin{plural} répertorié{plural}
          </p>
        </div>
        <div>
          <NewEngin parcs={parcs} sites={sites} onSuccess={fetchData} />
        </div>
      </div>

      {error && <FormError error={error} />}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom / Code</TableHead>
              <TableHead>Parc</TableHead>
              <TableHead>Site actuel</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Heures initiales</TableHead>
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
                  Aucun engin répertorié
                </TableCell>
              </TableRow>
            ) : (
              engins.map((engin: any) => (
                <TableRow key={engin.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Tractor className="h-4 w-4 text-primary" />
                      {engin.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">
                        {engin.parc?.name || "Non assigné"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">
                        {engin.site?.name || "Non assigné"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={engin.active ? "success" : "secondary"}>
                      {engin.active ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-sm font-mono">
                        {engin.initialHeureChassis || 0} h
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="w-0 text-right">
                    <EnginRowActions
                      engin={engin}
                      parcs={parcs}
                      sites={sites}
                      onEnginUpdated={fetchData}
                    />
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

export default EnginsPage;
