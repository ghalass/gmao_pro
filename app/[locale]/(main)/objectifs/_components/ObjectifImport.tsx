"use client";

import { ExcelImport } from "@/components/ExcelImport";

interface ObjectifImportResult {
  success: boolean;
  message: string;
  data?: any[];
  errors?: any[];
  summary?: {
    total: number;
    created: number;
    updated: number;
    errors: number;
    warnings: number;
  };
}

interface ObjectifImportProps {
  onImportComplete?: (result: ObjectifImportResult) => void;
  className?: string;
}

export function ObjectifImport({
  onImportComplete,
  className,
}: ObjectifImportProps) {
  const objectifColumns = [
    {
      name: "Année*",
      required: true,
      description: "Année de l'objectif (obligatoire)",
    },
    {
      name: "Parc*",
      required: true,
      description: "Nom du parc existant (obligatoire)",
    },
    {
      name: "Site*",
      required: true,
      description: "Nom du site existant (obligatoire)",
    },
    {
      name: "Dispo",
      required: false,
      description: "Objectif de disponibilité (optionnel)",
    },
    {
      name: "MTBF",
      required: false,
      description: "Objectif MTBF en heures (optionnel)",
    },
    {
      name: "TDM",
      required: false,
      description: "Objectif TDM en % (optionnel)",
    },
    {
      name: "Spécification huile",
      required: false,
      description: "Spécification huile (optionnel)",
    },
    {
      name: "Spécification GO",
      required: false,
      description: "Spécification gazole (optionnel)",
    },
    {
      name: "Spécification graisse",
      required: false,
      description: "Spécification graisse (optionnel)",
    },
  ];

  return (
    <ExcelImport
      resourceType="objectif"
      apiEndpoint="/api/objectifs/import"
      resourceName="objectifs"
      resourceDescription="Importez des objectifs en masse à partir d'un fichier Excel"
      templateColumns={objectifColumns}
      onImportComplete={onImportComplete}
      className={className}
    />
  );
}
