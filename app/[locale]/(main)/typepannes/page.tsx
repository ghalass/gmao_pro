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
import { ListOrdered, Wrench } from "lucide-react";
import NewTypepanne from "./_components/new-typepanne";
import FormError from "@/components/form/FormError";
import TypepanneRowActions from "./_components/typepanne-row-actions";
import { Spinner } from "@/components/ui/spinner";
import React, { useState, useEffect } from "react";

const TypepannesPage = () => {
  const [loading, setLoading] = useState(false);
  const [typepannes, setTypepannes] = React.useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const typepannesResponse = await apiFetch(API.TYPEPANNES.ALL);

      if (!typepannesResponse.ok) {
        setError(typepannesResponse.data?.message || "Erreur de chargement");
        return;
      }

      setTypepannes(typepannesResponse.data || []);
    } catch (err: any) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const plural = typepannes.length !== 1 ? "s" : "";

  return (
    <div className="mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Types de Pannes</h1>
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Spinner className="h-3 w-3" />
                <span className="text-xs">Mise à jour...</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {typepannes.length} type{plural} configuré{plural}
          </p>
        </div>
        <div>
          <NewTypepanne onSuccess={fetchData} />
        </div>
      </div>

      {error && <FormError error={error} />}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Pannes associées</TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {typepannes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground italic"
                >
                  Aucun type configuré
                </TableCell>
              </TableRow>
            ) : (
              typepannes.map((typepanne: any) => (
                <TableRow key={typepanne.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <ListOrdered className="h-4 w-4 text-primary" />
                      {typepanne.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {typepanne.description || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Wrench className="h-4 w-4" />
                      <span>{typepanne._count?.pannes || 0} pannes</span>
                    </div>
                  </TableCell>
                  <TableCell className="w-0 text-right">
                    <TypepanneRowActions
                      typepanne={typepanne}
                      onTypepanneUpdated={fetchData}
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

export default TypepannesPage;
