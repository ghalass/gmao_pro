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
import { Calendar, Target, Building2, Landmark } from "lucide-react";
import NewObjectif from "./_components/new-objectif";
import FormError from "@/components/form/FormError";
import ObjectifRowActions from "./_components/objectif-row-actions";
import { Spinner } from "@/components/ui/spinner";
import React, { useState, useEffect } from "react";

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
  createdAt: Date;
  updatedAt: Date;
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

const ObjectifsPage = () => {
  const [loading, setLoading] = useState(false);
  const [objectifs, setObjectifs] = React.useState<ObjectifWithRelations[]>([]);
  const [parcs, setParcs] = React.useState<any[]>([]);
  const [sites, setSites] = React.useState<any[]>([]);
  const [typeparcs, setTypeparcs] = React.useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        objectifsResponse,
        parcsResponse,
        sitesResponse,
        typeparcsResponse,
      ] = await Promise.all([
        apiFetch(API.OBJECTIFS.ALL),
        apiFetch(API.PARCS.ALL),
        apiFetch(API.SITES.ALL),
        apiFetch(API.TYPEPARCS.ALL),
      ]);

      if (!objectifsResponse.ok) {
        setError(objectifsResponse.data?.message || "Erreur de chargement");
        return;
      }

      setObjectifs(objectifsResponse.data || []);
      setParcs(parcsResponse.ok ? parcsResponse.data : []);
      setSites(sitesResponse.ok ? sitesResponse.data : []);
      setTypeparcs(typeparcsResponse.ok ? typeparcsResponse.data : []);
    } catch (err: any) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const plural = objectifs.length !== 1 ? "s" : "";

  return (
    <div className="mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Objectifs</h1>
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Spinner className="h-3 w-3" />
                <span className="text-xs">Mise à jour...</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {objectifs.length} objectif{plural} défini{plural}
          </p>
        </div>
        <div>
          <NewObjectif
            parcs={parcs}
            sites={sites}
            typeparcs={typeparcs}
            onSuccess={fetchData}
          />
        </div>
      </div>

      {error && <FormError error={error} />}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Année</TableHead>
              <TableHead>Parc</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Dispo</TableHead>
              <TableHead>MTBF</TableHead>
              <TableHead>TDM</TableHead>
              <TableHead>Spécifications</TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {objectifs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Aucun objectif défini
                </TableCell>
              </TableRow>
            ) : (
              objectifs?.map((objectif: ObjectifWithRelations) => {
                return (
                  <TableRow key={objectif.id}>
                    <TableCell>
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
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {objectif.site.name}
                      </div>
                    </TableCell>
                    <TableCell>{objectif.dispo}</TableCell>
                    <TableCell>{objectif.mtbf}</TableCell>
                    <TableCell>{objectif.tdm}</TableCell>
                    <TableCell>
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
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default ObjectifsPage;
