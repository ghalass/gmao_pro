"use client";

import { ExcelImport } from "@/components/ExcelImport";

interface OrganeImportResult {
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

interface OrganeImportProps {
  onImportComplete?: (result: OrganeImportResult) => void;
  className?: string;
}

export function OrganeImport({
  onImportComplete,
  className,
}: OrganeImportProps) {
  const organeColumns = [
    {
      name: "Nom",
      required: true,
      description: "Nom de l'organe (obligatoire)",
    },
    {
      name: "Type organe",
      required: true,
      description: "Type d'organe associé (obligatoire)",
    },
    {
      name: "Marque",
      required: false,
      description: "Marque de l'organe (optionnel)",
    },
    {
      name: "Numéro de série",
      required: false,
      description: "Numéro de série (optionnel)",
    },
    {
      name: "Date de mise en service",
      required: false,
      description: "Date de mise en service (format: JJ/MM/AAAA)",
    },
    {
      name: "Origine",
      required: false,
      description: "Origine (BRC, APPRO, AUTRE)",
    },
    {
      name: "Circuit",
      required: false,
      description: "Circuit (optionnel)",
    },
    {
      name: "HRM initial",
      required: false,
      description: "HRM initial (nombre décimal)",
    },
    {
      name: "Observations",
      required: false,
      description: "Observations (optionnel)",
    },
    {
      name: "Actif",
      required: false,
      description: "Statut de l'organe (true/false, oui/non, 1/0)",
    },
  ];

  return (
    <ExcelImport
      resourceType="organe"
      apiEndpoint="/api/organes/import"
      resourceName="organes"
      resourceDescription="Importez des organes en masse à partir d'un fichier Excel"
      templateColumns={organeColumns}
      onImportComplete={onImportComplete}
      className={className}
    />
  );
}
