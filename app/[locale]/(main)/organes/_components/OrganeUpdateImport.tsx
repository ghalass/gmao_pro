"use client";

import { ExcelImport } from "@/components/ExcelImport";

interface OrganeUpdateImportResult {
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

interface OrganeUpdateImportProps {
  onImportComplete?: (result: OrganeUpdateImportResult) => void;
  className?: string;
}

export function OrganeUpdateImport({
  onImportComplete,
  className,
}: OrganeUpdateImportProps) {
  const organeUpdateColumns = [
    {
      name: "Nom*",
      required: true,
      description: "Nom existant de l'organe à modifier (obligatoire)",
    },
    {
      name: "Type organe*",
      required: true,
      description: "Type d'organe existant (obligatoire pour l'identification)",
    },
    {
      name: "Nouveau nom",
      required: false,
      description: "Nouveau nom de l'organe (optionnel)",
    },
    {
      name: "Nouveau type organe",
      required: false,
      description: "Nouveau type d'organe (optionnel)",
    },
    {
      name: "Marque",
      required: false,
      description: "Nouvelle marque (optionnel)",
    },
    {
      name: "Numéro de série",
      required: false,
      description: "Nouveau numéro de série (optionnel)",
    },
    {
      name: "Date de mise en service",
      required: false,
      description: "Nouvelle date de mise en service (format: JJ/MM/AAAA)",
    },
    {
      name: "Origine",
      required: false,
      description: "Nouvelle origine (BRC, APPRO, AUTRE)",
    },
    {
      name: "Circuit",
      required: false,
      description: "Nouveau circuit (optionnel)",
    },
    {
      name: "HRM initial",
      required: false,
      description: "Nouveau HRM initial (nombre décimal)",
    },
    {
      name: "Observations",
      required: false,
      description: "Nouvelles observations (optionnel)",
    },
    {
      name: "Actif",
      required: false,
      description: "Nouveau statut de l'organe (true/false, oui/non, 1/0)",
    },
  ];

  return (
    <ExcelImport
      resourceType="organe-update"
      apiEndpoint="/api/organes/update-import"
      resourceName="organes (modification)"
      resourceDescription="Modifiez des organes existants en masse à partir d'un fichier Excel"
      templateColumns={organeUpdateColumns}
      onImportComplete={onImportComplete}
      className={className}
    />
  );
}
