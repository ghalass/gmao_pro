"use client";

import { ExcelImport } from "@/components/ExcelImport";

interface TypeorganeImportResult {
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

interface TypeorganeImportProps {
  onImportComplete?: (result: TypeorganeImportResult) => void;
  className?: string;
}

export function TypeorganeImport({
  onImportComplete,
  className,
}: TypeorganeImportProps) {
  const typeorganeColumns = [
    {
      name: "Nom",
      required: true,
      description: "Nom unique du type d'organe (obligatoire)",
    },
  ];

  return (
    <ExcelImport
      resourceType="typeorgane"
      apiEndpoint="/api/typeorganes/import"
      resourceName="types d'organes"
      resourceDescription="Importez des types d'organes en masse à partir d'un fichier Excel"
      templateColumns={typeorganeColumns}
      onImportComplete={onImportComplete}
      className={className}
    />
  );
}
