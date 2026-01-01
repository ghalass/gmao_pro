"use client";

import { ExcelImport } from "@/components/ExcelImport";

interface TypelubrifiantImportResult {
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

interface TypelubrifiantImportProps {
  onImportComplete?: (result: TypelubrifiantImportResult) => void;
  className?: string;
}

export function TypelubrifiantImport({
  onImportComplete,
  className,
}: TypelubrifiantImportProps) {
  const typelubrifiantColumns = [
    {
      name: "Nom du type de lubrifiant*",
      required: true,
      description: "Nom unique du type de lubrifiant (obligatoire)",
    },
  ];

  return (
    <ExcelImport
      resourceType="typelubrifiant"
      apiEndpoint="/api/typelubrifiants/import"
      resourceName="types de lubrifiants"
      resourceDescription="Importez des types de lubrifiants en masse à partir d'un fichier Excel"
      templateColumns={typelubrifiantColumns}
      onImportComplete={onImportComplete}
      className={className}
    />
  );
}
