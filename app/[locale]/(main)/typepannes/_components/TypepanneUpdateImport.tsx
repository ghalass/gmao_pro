"use client";

import { ExcelImport } from "@/components/ExcelImport";

interface TypepanneUpdateImportResult {
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

interface TypepanneUpdateImportProps {
  onImportComplete?: (result: TypepanneUpdateImportResult) => void;
  className?: string;
}

export function TypepanneUpdateImport({
  onImportComplete,
  className,
}: TypepanneUpdateImportProps) {
  const typepanneUpdateColumns = [
    {
      name: "Nom*",
      required: true,
      description: "Nom existant du type de panne à modifier (obligatoire)",
    },
    {
      name: "Nouveau nom",
      required: false,
      description: "Nouveau nom du type de panne (optionnel)",
    },
  ];

  return (
    <ExcelImport
      resourceType="typepanne-update"
      apiEndpoint="/api/typepannes/update-import"
      resourceName="types de pannes (modification)"
      resourceDescription="Modifiez des types de pannes existants en masse à partir d'un fichier Excel"
      templateColumns={typepanneUpdateColumns}
      onImportComplete={onImportComplete}
      className={className}
    />
  );
}
