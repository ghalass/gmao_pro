"use client";

// app/[locale]/(main)/typeparcs/page.tsx
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
import { Tractor, Car } from "lucide-react";
import NewTypeparc from "./_components/new-typeparc";
import FormError from "@/components/form/FormError";
import TypeparcRowActions from "./_components/typeparc-row-actions";
import { Spinner } from "@/components/ui/spinner";
import React, { useState, useEffect } from "react";

const TypeparcsPage = () => {
  const [loading, setLoading] = useState(false);
  const [typeparcs, setTypeparcs] = React.useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const typeparcsResponse = await apiFetch(API.TYPEPARCS.ALL);

      if (!typeparcsResponse.ok) {
        setError(typeparcsResponse.data?.message || "Erreur de chargement");
        return;
      }

      setTypeparcs(typeparcsResponse.data || []);
    } catch (err: any) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const plural = typeparcs.length !== 1 ? "s" : "";

  return (
    <div className="mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Types de Parcs</h1>
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Spinner className="h-3 w-3" />
                <span className="text-xs">Mise à jour...</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {typeparcs.length} type{plural} configuré{plural}
          </p>
        </div>
        <div>
          <NewTypeparc onSuccess={fetchData} />
        </div>
      </div>

      {error && <FormError error={error} />}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Parcs associés</TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {typeparcs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="h-24 text-center text-muted-foreground italic"
                >
                  Aucun type configuré
                </TableCell>
              </TableRow>
            ) : (
              typeparcs.map((typeparc: any) => (
                <TableRow key={typeparc.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Tractor className="h-4 w-4 text-primary" />
                      {typeparc.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Car className="h-4 w-4" />
                      <span>{typeparc._count?.parcs || 0} parcs</span>
                    </div>
                  </TableCell>
                  <TableCell className="w-0 text-right">
                    <TypeparcRowActions
                      typeparc={typeparc}
                      onTypeparcUpdated={fetchData}
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

export default TypeparcsPage;
