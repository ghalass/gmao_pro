"use client";

import { ExcelImport } from "@/components/ExcelImport";

interface TypeconsommationlubUpdateImportResult {
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

interface TypeconsommationlubUpdateImportProps {
  onImportComplete?: (result: TypeconsommationlubUpdateImportResult) => void;
  className?: string;
}

export function TypeconsommationlubUpdateImport({
  onImportComplete,
  className,
}: TypeconsommationlubUpdateImportProps) {
  const typeconsommationlubUpdateColumns = [
    {
      name: "Nom du type*",
      required: true,
      description:
        "Nom existant du type de consommation de lubrifiant à modifier (obligatoire)",
    },
  ];

  return (
    <ExcelImport
      resourceType="typeconsommationlub-update"
      apiEndpoint="/api/typeconsommationlubs/update-import"
      resourceName="types de consommation de lubrifiants (modification)"
      resourceDescription="Modifiez des types de consommation de lubrifiants existants en masse à partir d'un fichier Excel"
      templateColumns={typeconsommationlubUpdateColumns}
      onImportComplete={onImportComplete}
      className={className}
    />
  );
}
