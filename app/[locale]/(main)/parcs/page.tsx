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
import { Landmark, Truck } from "lucide-react";
import NewParc from "./_components/new-parc";
import FormError from "@/components/form/FormError";
import ParcRowActions from "./_components/parc-row-actions";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import React, { useState, useEffect } from "react";

const ParcsPage = () => {
  const [loading, setLoading] = useState(false);
  const [parcs, setParcs] = React.useState<any[]>([]);
  const [typeparcs, setTypeparcs] = React.useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [parcsResponse, typeparcsResponse] = await Promise.all([
        apiFetch(API.PARCS.ALL),
        apiFetch(API.TYPEPARCS.ALL),
      ]);

      if (!parcsResponse.ok) {
        setError(parcsResponse.data?.message);
        return;
      }

      setParcs(parcsResponse.data || []);
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

  const plural = parcs.length !== 1 ? "s" : "";

  return (
    <div className="mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Parcs</h1>
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Spinner className="h-3 w-3" />
                <span className="text-xs">Mise à jour...</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {parcs.length} parc{plural} configuré{plural}
          </p>
        </div>
        <div>
          <NewParc typeparcs={typeparcs} onSuccess={fetchData} />
        </div>
      </div>

      {error && <FormError error={error} />}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Engins attachés</TableHead>
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
                  Aucun parc configuré
                </TableCell>
              </TableRow>
            ) : (
              parcs.map((parc: any) => (
                <TableRow key={parc.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-primary" />
                      {parc.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {parc.typeparc?.name || "Non défini"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Truck className="h-4 w-4" />
                      <span>{parc._count?.engins || 0} engins</span>
                    </div>
                  </TableCell>
                  <TableCell className="w-0 text-right">
                    <ParcRowActions
                      parc={parc}
                      typeparcs={typeparcs}
                      onParcUpdated={fetchData}
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

export default ParcsPage;
