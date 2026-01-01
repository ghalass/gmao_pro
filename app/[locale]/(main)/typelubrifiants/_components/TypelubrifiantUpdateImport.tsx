"use client";

import { ExcelImport } from "@/components/ExcelImport";

interface TypelubrifiantUpdateImportResult {
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

interface TypelubrifiantUpdateImportProps {
  onImportComplete?: (result: TypelubrifiantUpdateImportResult) => void;
  className?: string;
}

export function TypelubrifiantUpdateImport({
  onImportComplete,
  className,
}: TypelubrifiantUpdateImportProps) {
  const typelubrifiantUpdateColumns = [
    {
      name: "Nom du type de lubrifiant*",
      required: true,
      description:
        "Nom existant du type de lubrifiant à modifier (obligatoire)",
    },
  ];

  return (
    <ExcelImport
      resourceType="typelubrifiant-update"
      apiEndpoint="/api/typelubrifiants/update-import"
      resourceName="types de lubrifiants (modification)"
      resourceDescription="Modifiez des types de lubrifiants existants en masse à partir d'un fichier Excel"
      templateColumns={typelubrifiantUpdateColumns}
      onImportComplete={onImportComplete}
      className={className}
    />
  );
}
