"use client";

// app/[locale]/(main)/lubrifiants/page.tsx
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
import { Droplet, Calendar, Landmark } from "lucide-react";
import NewLubrifiant from "./_components/new-lubrifiant";
import FormError from "@/components/form/FormError";
import LubrifiantRowActions from "./_components/lubrifiant-row-actions";
import { getJoinedDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import React, { useState, useEffect } from "react";

const LubrifiantsPage = () => {
  const [loading, setLoading] = useState(false);
  const [lubrifiants, setLubrifiants] = React.useState<any[]>([]);
  const [typelubrifiants, setTypelubrifiants] = React.useState<any[]>([]);
  const [parcs, setParcs] = React.useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [lubrifiantsResponse, typelubrifiantsResponse, parcsResponse] =
        await Promise.all([
          apiFetch(API.LUBRIFIANTS.ALL),
          apiFetch(API.TYPELUBRIFIANTS.ALL),
          apiFetch(API.PARCS.ALL),
        ]);

      if (!lubrifiantsResponse.ok) {
        setError(lubrifiantsResponse.data?.message || "Erreur de chargement");
        return;
      }

      setLubrifiants(lubrifiantsResponse.data || []);
      setTypelubrifiants(
        typelubrifiantsResponse.ok ? typelubrifiantsResponse.data : []
      );
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

  const plural = lubrifiants.length !== 1 ? "s" : "";

  return (
    <div className="mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Lubrifiants</h1>
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Spinner className="h-3 w-3" />
                <span className="text-xs">Mise à jour...</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {lubrifiants.length} lubrifiant{plural} configuré{plural}
          </p>
        </div>
        <div>
          <NewLubrifiant
            typelubrifiants={typelubrifiants}
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
              <TableHead>Date de création</TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lubrifiants.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground italic"
                >
                  Aucun lubrifiant configuré
                </TableCell>
              </TableRow>
            ) : (
              lubrifiants.map((lubrifiant: any) => (
                <TableRow key={lubrifiant.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Droplet className="h-4 w-4 text-primary" />
                      {lubrifiant.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {lubrifiant.typelubrifiant?.name || "Non défini"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-50">
                      {lubrifiant.lubrifiantParc?.length > 0 ? (
                        lubrifiant.lubrifiantParc.map((lp: any) => (
                          <Badge
                            key={lp.parc.id}
                            variant="outline"
                            className="text-[10px] px-1 py-0"
                          >
                            <Landmark className="h-3 w-3 mr-1" />
                            {lp.parc.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Aucun parc
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {getJoinedDate(lubrifiant.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell className="w-0 text-right">
                    <LubrifiantRowActions
                      lubrifiant={lubrifiant}
                      typelubrifiants={typelubrifiants}
                      parcs={parcs}
                      onLubrifiantUpdated={fetchData}
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

export default LubrifiantsPage;
