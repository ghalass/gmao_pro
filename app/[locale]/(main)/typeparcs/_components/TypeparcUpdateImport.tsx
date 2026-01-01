"use client";

import { ExcelImport } from "@/components/ExcelImport";
import { TypeparcUpdateImportResult } from "@/lib/validation/typeparc-update-import.schema";

interface TypeparcUpdateImportProps {
  onImportComplete?: (result: TypeparcUpdateImportResult) => void;
  onCancel?: () => void;
  className?: string;
}

export function TypeparcUpdateImport({
  onImportComplete,
  onCancel,
  className,
}: TypeparcUpdateImportProps) {
  const typeparcUpdateColumns = [
    {
      name: "Nom du type de parc*",
      required: true,
      description: "Nom existant du type de parc à modifier (obligatoire)",
    },
  ];

  return (
    <ExcelImport
      resourceType="typeparc-update"
      apiEndpoint="/api/typeparcs/update-import"
      resourceName="types de parc (modification)"
      resourceDescription="Modifiez des types de parc existants à partir d'un fichier Excel"
      templateColumns={typeparcUpdateColumns}
      onImportComplete={onImportComplete}
      onCancel={onCancel}
      className={className}
    />
  );
}
