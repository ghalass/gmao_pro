"use client";

import { ExcelImport } from "@/components/ExcelImport";

interface TypeconsommationlubImportResult {
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

interface TypeconsommationlubImportProps {
  onImportComplete?: (result: TypeconsommationlubImportResult) => void;
  className?: string;
}

export function TypeconsommationlubImport({
  onImportComplete,
  className,
}: TypeconsommationlubImportProps) {
  const typeconsommationlubColumns = [
    {
      name: "Nom du type*",
      required: true,
      description:
        "Nom unique du type de consommation de lubrifiant (obligatoire)",
    },
  ];

  return (
    <ExcelImport
      resourceType="typeconsommationlub"
      apiEndpoint="/api/typeconsommationlubs/import"
      resourceName="types de consommation de lubrifiants"
      resourceDescription="Importez des types de consommation de lubrifiants en masse à partir d'un fichier Excel"
      templateColumns={typeconsommationlubColumns}
      onImportComplete={onImportComplete}
      className={className}
    />
  );
}
