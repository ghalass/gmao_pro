"use client";

import { ExcelImport } from "@/components/ExcelImport";

interface TypeorganeUpdateImportResult {
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

interface TypeorganeUpdateImportProps {
  onImportComplete?: (result: TypeorganeUpdateImportResult) => void;
  className?: string;
}

export function TypeorganeUpdateImport({
  onImportComplete,
  className,
}: TypeorganeUpdateImportProps) {
  const typeorganeUpdateColumns = [
    {
      name: "Nom*",
      required: true,
      description: "Nom existant du type d'organe à modifier (obligatoire)",
    },
    {
      name: "Nouveau nom",
      required: false,
      description: "Nouveau nom du type d'organe (optionnel)",
    },
  ];

  return (
    <ExcelImport
      resourceType="typeorgane-update"
      apiEndpoint="/api/typeorganes/update-import"
      resourceName="types d'organes (modification)"
      resourceDescription="Modifiez des types d'organes existants en masse à partir d'un fichier Excel"
      templateColumns={typeorganeUpdateColumns}
      onImportComplete={onImportComplete}
      className={className}
    />
  );
}
