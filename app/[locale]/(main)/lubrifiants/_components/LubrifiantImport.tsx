"use client";

import { ExcelImport } from "@/components/ExcelImport";

interface LubrifiantImportResult {
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

interface LubrifiantImportProps {
  onImportComplete?: (result: LubrifiantImportResult) => void;
  className?: string;
}

export function LubrifiantImport({
  onImportComplete,
  className,
}: LubrifiantImportProps) {
  const lubrifiantColumns = [
    {
      name: "Nom",
      required: true,
      description: "Nom unique du lubrifiant (obligatoire)",
    },
    {
      name: "Type lubrifiant",
      required: true,
      description: "Type de lubrifiant associé (obligatoire)",
    },
  ];

  return (
    <ExcelImport
      resourceType="lubrifiant"
      apiEndpoint="/api/lubrifiants/import"
      resourceName="lubrifiants"
      resourceDescription="Importez des lubrifiants en masse à partir d'un fichier Excel"
      templateColumns={lubrifiantColumns}
      onImportComplete={onImportComplete}
      className={className}
    />
  );
}
