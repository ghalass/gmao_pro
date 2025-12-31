"use client";

// app/[locale]/(main)/typeorganes/page.tsx
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
import { Settings, Calendar, Package } from "lucide-react";
import NewTypeorgane from "./_components/new-typeorgane";
import FormError from "@/components/form/FormError";
import TypeorganeRowActions from "./_components/typeorgane-row-actions";
import { Spinner } from "@/components/ui/spinner";
import React, { useState, useEffect } from "react";

const TypeorganesPage = () => {
  const [loading, setLoading] = useState(false);
  const [typeorganes, setTypeorganes] = React.useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const typeorganesResponse = await apiFetch(API.TYPEORGANES.ALL);

      if (!typeorganesResponse.ok) {
        setError(typeorganesResponse.data?.message || "Erreur de chargement");
        return;
      }

      setTypeorganes(typeorganesResponse.data || []);
    } catch (err: any) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const plural = typeorganes.length !== 1 ? "s" : "";

  return (
    <div className="mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Types d'Organes</h1>
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Spinner className="h-3 w-3" />
                <span className="text-xs">Mise à jour...</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {typeorganes.length} type{plural} configuré{plural}
          </p>
        </div>
        <div>
          <NewTypeorgane onSuccess={fetchData} />
        </div>
      </div>

      {error && <FormError error={error} />}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Parcs associés</TableHead>
              <TableHead>Organes associés</TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {typeorganes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground italic"
                >
                  Aucun type configuré
                </TableCell>
              </TableRow>
            ) : (
              typeorganes.map((typeorgane: any) => {
                const parcCount = typeorgane.typeOrganeParcs?.length || 0;
                const organeCount = typeorgane._count?.organes || 0;
                const pluralParc = parcCount !== 1 ? "s" : "";
                const pluralOrgane = organeCount !== 1 ? "s" : "";
                return (
                  <TableRow key={typeorgane.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-primary" />
                        {typeorgane.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span>
                          {parcCount > 0 ? `${parcCount} parcs` : "Aucun parc"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Settings className="h-4 w-4" />
                        <span>
                          {organeCount > 0
                            ? `${organeCount} organes`
                            : "Aucun organe"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="w-0 text-right">
                      <TypeorganeRowActions
                        typeorgane={typeorgane}
                        onTypeorganeUpdated={fetchData}
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

export default TypeorganesPage;
