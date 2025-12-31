"use client";

// app/[locale]/(main)/typelubrifiants/page.tsx
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
import { Droplet, Calendar } from "lucide-react";
import NewTypelubrifiant from "./_components/new-typelubrifiant";
import FormError from "@/components/form/FormError";
import TypelubrifiantRowActions from "./_components/typelubrifiant-row-actions";
import { getJoinedDate } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import React, { useState, useEffect } from "react";

const TypelubrifiantsPage = () => {
  const [loading, setLoading] = useState(false);
  const [typelubrifiants, setTypelubrifiants] = React.useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const typelubrifiantsResponse = await apiFetch(API.TYPELUBRIFIANTS.ALL);

      if (!typelubrifiantsResponse.ok) {
        setError(
          typelubrifiantsResponse.data?.message || "Erreur de chargement"
        );
        return;
      }

      setTypelubrifiants(typelubrifiantsResponse.data || []);
    } catch (err: any) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const plural = typelubrifiants.length !== 1 ? "s" : "";

  return (
    <div className="mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Types de Lubrifiants</h1>
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Spinner className="h-3 w-3" />
                <span className="text-xs">Mise à jour...</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {typelubrifiants.length} type{plural} configuré{plural}
          </p>
        </div>
        <div>
          <NewTypelubrifiant onSuccess={fetchData} />
        </div>
      </div>

      {error && <FormError error={error} />}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Lubrifiants associés</TableHead>
              <TableHead>Date de création</TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {typelubrifiants.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground italic"
                >
                  Aucun type de lubrifiant configuré
                </TableCell>
              </TableRow>
            ) : (
              typelubrifiants.map((typelubrifiant: any) => {
                const count = typelubrifiant.lubrifiants?.length || 0;
                const pluralLub = count !== 1 ? "s" : "";
                return (
                  <TableRow key={typelubrifiant.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Droplet className="h-4 w-4 text-primary" />
                        {typelubrifiant.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Droplet className="h-4 w-4" />
                        <span>
                          {count} lubrifiant{pluralLub}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {getJoinedDate(typelubrifiant.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="w-0 text-right">
                      <TypelubrifiantRowActions
                        typelubrifiant={typelubrifiant}
                        onTypelubrifiantUpdated={fetchData}
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

export default TypelubrifiantsPage;
