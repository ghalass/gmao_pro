"use client";

import { ExcelImport } from "@/components/ExcelImport";

interface ObjectifUpdateImportResult {
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

interface ObjectifUpdateImportProps {
  onImportComplete?: (result: ObjectifUpdateImportResult) => void;
  className?: string;
}

export function ObjectifUpdateImport({
  onImportComplete,
  className,
}: ObjectifUpdateImportProps) {
  const objectifColumns = [
    {
      name: "Année*",
      required: true,
      description: "Année de l'objectif existant (obligatoire)",
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
      description: "Nouvel objectif de disponibilité (optionnel)",
    },
    {
      name: "MTBF",
      required: false,
      description: "Nouvel objectif MTBF en heures (optionnel)",
    },
    {
      name: "TDM",
      required: false,
      description: "Nouvel objectif TDM en % (optionnel)",
    },
    {
      name: "Spécification huile",
      required: false,
      description: "Nouvelle spécification huile (optionnel)",
    },
    {
      name: "Spécification GO",
      required: false,
      description: "Nouvelle spécification gazole (optionnel)",
    },
    {
      name: "Spécification graisse",
      required: false,
      description: "Nouvelle spécification graisse (optionnel)",
    },
  ];

  return (
    <ExcelImport
      resourceType="objectif"
      apiEndpoint="/api/objectifs/update-import"
      resourceName="objectifs"
      resourceDescription="Modifiez des objectifs existants en masse depuis un fichier Excel"
      templateColumns={objectifColumns}
      onImportComplete={onImportComplete}
      className={className}
    />
  );
}
