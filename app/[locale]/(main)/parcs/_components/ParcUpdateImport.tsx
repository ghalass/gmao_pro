"use client";

import { ExcelImport } from "@/components/ExcelImport";

interface ParcUpdateImportResult {
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

interface ParcUpdateImportProps {
  onImportComplete?: (result: ParcUpdateImportResult) => void;
  className?: string;
}

export function ParcUpdateImport({
  onImportComplete,
  className,
}: ParcUpdateImportProps) {
  const parcUpdateColumns = [
    {
      name: "Nom du parc*",
      required: true,
      description: "Nom existant du parc à modifier (obligatoire)",
    },
    {
      name: "Type de parc",
      required: false,
      description: "Nom du type de parc existant (optionnel)",
    },
  ];

  return (
    <ExcelImport
      resourceType="parc-update"
      apiEndpoint="/api/parcs/update-import"
      resourceName="parcs (modification)"
      resourceDescription="Modifiez des parcs existants en masse à partir d'un fichier Excel"
      templateColumns={parcUpdateColumns}
      onImportComplete={onImportComplete}
      className={className}
    />
  );
}
