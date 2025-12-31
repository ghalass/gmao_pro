"use client";

// app/[locale]/(main)/organes/page.tsx
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
import { Calendar, CheckCircle, Settings, Wrench, XCircle } from "lucide-react";
import { Organe, TypeOrgane } from "@/lib/generated/prisma/client";
import NewOrgane from "./_components/new-organe";
import FormError from "@/components/form/FormError";
import OrganeRowActions from "./_components/organe-row-actions";
import { Spinner } from "@/components/ui/spinner";
import React, { useState, useEffect } from "react";

type OrganeWithType = Organe & {
  type_organe: TypeOrgane;
};

const OrganesPage = () => {
  const [loading, setLoading] = useState(false);
  const [organes, setOrganes] = React.useState<OrganeWithType[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const organesResponse = await apiFetch(API.ORGANES.ALL);

      if (!organesResponse.ok) {
        setError(organesResponse.data?.message || "Erreur de chargement");
        return;
      }

      setOrganes(organesResponse.data || []);
    } catch (err: any) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const plural = organes.length !== 1 ? "s" : "";

  return (
    <div className="mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Organes</h1>
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Spinner className="h-3 w-3" />
                <span className="text-xs">Mise à jour...</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {organes.length} organe{plural}
          </p>
        </div>
        <div>
          <NewOrgane onSuccess={fetchData} />
        </div>
      </div>

      {error && <FormError error={error} />}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organe</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Marque</TableHead>
              <TableHead>N° Série</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>HRM Initial</TableHead>
              <TableHead>Date de mesure</TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Aucun organe
                </TableCell>
              </TableRow>
            ) : (
              organes?.map((currentOrgane: OrganeWithType) => {
                return (
                  <TableRow key={currentOrgane.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                          <Settings className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="flex items-center gap-2">
                            {currentOrgane.name}
                          </span>
                          {currentOrgane.obs && (
                            <span className="text-xs text-muted-foreground">
                              {currentOrgane.obs}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="mr-1">
                        {currentOrgane.type_organe?.name || "Non défini"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {currentOrgane.marque || (
                        <span className="text-sm text-muted-foreground">
                          Non spécifié
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {currentOrgane.sn || (
                        <span className="text-sm text-muted-foreground">
                          Non spécifié
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {currentOrgane.active ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        {currentOrgane.active ? "Actif" : "Inactif"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                        {Number(currentOrgane.hrm_initial) || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {currentOrgane.date_mes
                          ? new Date(currentOrgane.date_mes).toLocaleDateString(
                              "fr-FR"
                            )
                          : "Non définie"}
                      </div>
                    </TableCell>
                    <TableCell className="w-0 text-right">
                      <OrganeRowActions
                        organe={currentOrgane}
                        onOrganeUpdated={fetchData}
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

export default OrganesPage;
