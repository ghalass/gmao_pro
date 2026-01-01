"use client";

import { ExcelImport } from "@/components/ExcelImport";

interface TypepanneImportResult {
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

interface TypepanneImportProps {
  onImportComplete?: (result: TypepanneImportResult) => void;
  className?: string;
}

export function TypepanneImport({
  onImportComplete,
  className,
}: TypepanneImportProps) {
  const typepanneColumns = [
    {
      name: "Nom",
      required: true,
      description: "Nom unique du type de panne (obligatoire)",
    },
  ];

  return (
    <ExcelImport
      resourceType="typepanne"
      apiEndpoint="/api/typepannes/import"
      resourceName="types de pannes"
      resourceDescription="Importez des types de pannes en masse à partir d'un fichier Excel"
      templateColumns={typepanneColumns}
      onImportComplete={onImportComplete}
      className={className}
    />
  );
}
