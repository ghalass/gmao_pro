"use client";

// app/[locale]/(main)/rapports/rje/page.tsx
import React, { useState } from "react";
import { useRapportRje } from "@/hooks/useRapportRje";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Calendar, FileText, TrendingUp, Play } from "lucide-react";
import FormError from "@/components/form/FormError";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

function RapportRjePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [shouldGenerate, setShouldGenerate] = useState<boolean>(false);
  const { rapportData, isLoading, error, refresh } = useRapportRje(
    shouldGenerate ? selectedDate : null
  );

  const handleGenerateReport = () => {
    setShouldGenerate(true);
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "long",
      year: "numeric",
    };
    return date.toLocaleDateString("fr-FR", options);
  };

  const formatValue = (value: number | null | undefined) => {
    return value !== null && value !== undefined ? value.toFixed(1) : "-";
  };

  return (
    <div className="mx-auto p-4">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">
            Rapport Journalier des Engins (RJE)
          </h1>
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Spinner className="h-3 w-3" />
              <span className="text-xs">Chargement...</span>
            </div>
          )}
        </div>

        {/* Sélecteur de date */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate.toISOString().split("T")[0]}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    setSelectedDate(newDate);
                    setShouldGenerate(false); // Réinitialiser pour forcer la régénération
                  }}
                  className="px-3 py-2 border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleGenerateReport}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Générer
              </Button>
              {shouldGenerate && (
                <Button
                  variant="outline"
                  onClick={refresh}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Actualiser
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      {error && <FormError error={error} />}

      {/* Tableau des indicateurs */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background">
                  ENGINS
                </TableHead>
                <TableHead className="text-center">DISP J</TableHead>
                <TableHead className="text-center">DISP M</TableHead>
                <TableHead className="text-center">DISP C</TableHead>
                <TableHead className="text-center">TDM J</TableHead>
                <TableHead className="text-center">TDM M</TableHead>
                <TableHead className="text-center">TDM C</TableHead>
                <TableHead className="text-center">MTBF M</TableHead>
                <TableHead className="text-center">MTBF C</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Spinner className="h-4 w-4" />
                      <span>Chargement des données...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : rapportData?.sites && rapportData.sites.length > 0 ? (
                <>
                  {rapportData.sites.map((siteData) => (
                    <React.Fragment key={siteData.site.id}>
                      {Object.values(siteData.parcs).map((parcData) => (
                        <React.Fragment key={parcData.parc.id}>
                          {parcData.engins.map((engin, index) => (
                            <TableRow key={engin.id}>
                              <TableCell className="sticky left-0 bg-background font-medium">
                                {index === 0 && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                    <span>{siteData.site.name}</span>
                                    <span>›</span>
                                    <span>{parcData.parc.name}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                                  {engin.name}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                {formatValue(engin.indicators.day.disp)}
                              </TableCell>
                              <TableCell className="text-center">
                                {formatValue(engin.indicators.month.disp)}
                              </TableCell>
                              <TableCell className="text-center">
                                {formatValue(engin.indicators.year.disp)}
                              </TableCell>
                              <TableCell className="text-center">
                                {formatValue(engin.indicators.day.tdm)}
                              </TableCell>
                              <TableCell className="text-center">
                                {formatValue(engin.indicators.month.tdm)}
                              </TableCell>
                              <TableCell className="text-center">
                                {formatValue(engin.indicators.year.tdm)}
                              </TableCell>
                              <TableCell className="text-center">
                                {formatValue(engin.indicators.month.mtbf)}
                              </TableCell>
                              <TableCell className="text-center">
                                {formatValue(engin.indicators.year.mtbf)}
                              </TableCell>
                            </TableRow>
                          ))}

                          {/* Ligne des objectifs par parc */}
                          {parcData.objectif && (
                            <TableRow className="bg-muted/50 font-semibold">
                              <TableCell className="sticky left-0 bg-muted/50">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4 text-primary" />
                                  OBJ. {parcData.parc.name}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">-</TableCell>
                              <TableCell className="text-center">
                                {formatValue(parcData.objectif.dispo)}
                              </TableCell>
                              <TableCell className="text-center">
                                {formatValue(parcData.objectif.dispo)}
                              </TableCell>
                              <TableCell className="text-center">-</TableCell>
                              <TableCell className="text-center">
                                {formatValue(parcData.objectif.tdm)}
                              </TableCell>
                              <TableCell className="text-center">
                                {formatValue(parcData.objectif.tdm)}
                              </TableCell>
                              <TableCell className="text-center">
                                {formatValue(parcData.objectif.mtbf)}
                              </TableCell>
                              <TableCell className="text-center">
                                {formatValue(parcData.objectif.mtbf)}
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </React.Fragment>
                  ))}

                  {/* Ligne des objectifs */}
                  {rapportData.objectifs && (
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell className="sticky left-0 bg-muted/50">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          OBJ.
                        </div>
                      </TableCell>
                      <TableCell className="text-center">-</TableCell>
                      <TableCell className="text-center">
                        {formatValue(rapportData.objectifs.dispo)}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatValue(rapportData.objectifs.dispo)}
                      </TableCell>
                      <TableCell className="text-center">-</TableCell>
                      <TableCell className="text-center">
                        {formatValue(rapportData.objectifs.tdm)}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatValue(rapportData.objectifs.tdm)}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatValue(rapportData.objectifs.mtbf)}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatValue(rapportData.objectifs.mtbf)}
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-24 text-center text-muted-foreground italic"
                  >
                    {isLoading
                      ? "Chargement..."
                      : "Aucune donnée disponible pour cette date"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Légende */}
      <Card className="mt-4 p-4">
        <div className="text-sm text-muted-foreground">
          <div className="font-medium mb-2">Légende :</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>• J = Jour (sélectionné)</div>
            <div>• M = Mois (du 1er au jour sélectionné)</div>
            <div>• C = Cumul annuel (du 1er janvier au jour sélectionné)</div>
          </div>
          <div className="mt-2">
            <div>• DISP = Disponibilité (%)</div>
            <div>• TDM = Taux de Disponibilité Mécanique (%)</div>
            <div>• MTBF = Mean Time Between Failures (heures)</div>
            <div>• OBJ. = Objectifs par parc/site</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default RapportRjePage;
