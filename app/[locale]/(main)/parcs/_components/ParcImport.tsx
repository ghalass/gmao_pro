"use client";

import { ExcelImport } from "@/components/ExcelImport";

interface ParcImportResult {
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

interface ParcImportProps {
  onImportComplete?: (result: ParcImportResult) => void;
  className?: string;
}

export function ParcImport({ onImportComplete, className }: ParcImportProps) {
  const parcColumns = [
    {
      name: "Nom du parc",
      required: true,
      description: "Nom unique du parc (obligatoire)",
    },
    {
      name: "Type de parc",
      required: true,
      description: "Nom du type de parc existant (obligatoire)",
    },
  ];

  return (
    <ExcelImport
      resourceType="parc"
      apiEndpoint="/api/parcs/import"
      resourceName="parcs"
      resourceDescription="Importez des parcs en masse à partir d'un fichier Excel"
      templateColumns={parcColumns}
      onImportComplete={onImportComplete}
      className={className}
    />
  );
}
