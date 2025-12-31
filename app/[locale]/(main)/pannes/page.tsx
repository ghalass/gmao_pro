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
import { Wrench, ListTree } from "lucide-react";
import NewPanne from "./_components/new-panne";
import FormError from "@/components/form/FormError";
import PanneRowActions from "./_components/panne-row-actions";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import React, { useState, useEffect } from "react";
import { getScopedI18n } from "@/locales/server";

const PannesPage = () => {
  const [loading, setLoading] = useState(false);
  const [pannes, setPannes] = React.useState<any[]>([]);
  const [typepannes, setTypepannes] = React.useState<any[]>([]);
  const [parcs, setParcs] = React.useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [pannesResponse, typepannesResponse, parcsResponse] =
        await Promise.all([
          apiFetch(API.PANNES.ALL),
          apiFetch(API.TYPEPANNES.ALL),
          apiFetch(API.PARCS.ALL),
        ]);

      if (!pannesResponse.ok) {
        setError(pannesResponse.data?.message || "Erreur de chargement");
        return;
      }

      setPannes(pannesResponse.data || []);
      setTypepannes(typepannesResponse.ok ? typepannesResponse.data : []);
      setParcs(parcsResponse.ok ? parcsResponse.data : []);
    } catch (err: any) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const plural = pannes.length !== 1 ? "s" : "";

  return (
    <div className="mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Pannes</h1>
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Spinner className="h-3 w-3" />
                <span className="text-xs">Mise à jour...</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {pannes.length} panne{plural} déclarée{plural}
          </p>
        </div>
        <div>
          <NewPanne
            typepannes={typepannes}
            parcs={parcs}
            onSuccess={fetchData}
          />
        </div>
      </div>

      {error && <FormError error={error} />}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Parcs associés</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Saisies liées</TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pannes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground italic"
                >
                  Aucune panne déclarée
                </TableCell>
              </TableRow>
            ) : (
              pannes.map((panne: any) => (
                <TableRow key={panne.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-primary" />
                      {panne.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {panne.typepanne?.name || "Non défini"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-50">
                      {panne.parcs?.length > 0 ? (
                        panne.parcs.map((p: any) => (
                          <Badge
                            key={p.id}
                            variant="secondary"
                            className="text-[10px] px-1 py-0"
                          >
                            {p.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-destructive italic">
                          Aucun parc associé
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {panne.description || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <ListTree className="h-4 w-4" />
                      <span>{panne._count?.saisiehim || 0} saisies</span>
                    </div>
                  </TableCell>
                  <TableCell className="w-0 text-right">
                    <PanneRowActions
                      panne={panne}
                      typepannes={typepannes}
                      parcs={parcs}
                      onPanneUpdated={fetchData}
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

export default PannesPage;
