"use client";

import { ExcelImport } from "@/components/ExcelImport";

interface PanneImportResult {
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

interface PanneImportProps {
  onImportComplete?: (result: PanneImportResult) => void;
  className?: string;
}

export function PanneImport({ onImportComplete, className }: PanneImportProps) {
  const panneColumns = [
    {
      name: "Nom",
      required: true,
      description: "Nom unique de la panne (obligatoire)",
    },
    {
      name: "Type panne",
      required: true,
      description: "Type de panne associé (obligatoire)",
    },
    {
      name: "Description",
      required: false,
      description: "Description de la panne (optionnel)",
    },
  ];

  return (
    <ExcelImport
      resourceType="panne"
      apiEndpoint="/api/pannes/import"
      resourceName="pannes"
      resourceDescription="Importez des pannes en masse à partir d'un fichier Excel"
      templateColumns={panneColumns}
      onImportComplete={onImportComplete}
      className={className}
    />
  );
}
