"use client";

import { ExcelImport } from "@/components/ExcelImport";

interface PanneUpdateImportResult {
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

interface PanneUpdateImportProps {
  onImportComplete?: (result: PanneUpdateImportResult) => void;
  className?: string;
}

export function PanneUpdateImport({
  onImportComplete,
  className,
}: PanneUpdateImportProps) {
  const panneUpdateColumns = [
    {
      name: "Nom*",
      required: true,
      description: "Nom existant de la panne à modifier (obligatoire)",
    },
    {
      name: "Nouveau nom",
      required: false,
      description: "Nouveau nom de la panne (optionnel)",
    },
    {
      name: "Type panne",
      required: false,
      description: "Nouveau type de panne (optionnel)",
    },
    {
      name: "Description",
      required: false,
      description: "Nouvelle description (optionnel)",
    },
  ];

  return (
    <ExcelImport
      resourceType="panne-update"
      apiEndpoint="/api/pannes/update-import"
      resourceName="pannes (modification)"
      resourceDescription="Modifiez des pannes existantes en masse à partir d'un fichier Excel"
      templateColumns={panneUpdateColumns}
      onImportComplete={onImportComplete}
      className={className}
    />
  );
}
