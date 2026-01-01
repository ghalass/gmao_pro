"use client";

import { ExcelImport } from "@/components/ExcelImport";

interface LubrifiantUpdateImportResult {
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

interface LubrifiantUpdateImportProps {
  onImportComplete?: (result: LubrifiantUpdateImportResult) => void;
  className?: string;
}

export function LubrifiantUpdateImport({
  onImportComplete,
  className,
}: LubrifiantUpdateImportProps) {
  const lubrifiantUpdateColumns = [
    {
      name: "Nom*",
      required: true,
      description: "Nom existant du lubrifiant à modifier (obligatoire)",
    },
    {
      name: "Nouveau nom",
      required: false,
      description: "Nouveau nom du lubrifiant (optionnel)",
    },
    {
      name: "Type lubrifiant",
      required: false,
      description: "Nouveau type de lubrifiant (optionnel)",
    },
  ];

  return (
    <ExcelImport
      resourceType="lubrifiant-update"
      apiEndpoint="/api/lubrifiants/update-import"
      resourceName="lubrifiants (modification)"
      resourceDescription="Modifiez des lubrifiants existants en masse à partir d'un fichier Excel"
      templateColumns={lubrifiantUpdateColumns}
      onImportComplete={onImportComplete}
      className={className}
    />
  );
}
