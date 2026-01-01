"use client";

import { ExcelImport } from "@/components/ExcelImport";
import { TypeparcImportResult } from "@/lib/validation/typeparc-import.schema";

interface TypeparcImportProps {
  onImportComplete?: (result: TypeparcImportResult) => void;
  className?: string;
}

export function TypeparcImport({
  onImportComplete,
  className,
}: TypeparcImportProps) {
  const typeparcColumns = [
    {
      name: "Nom du type de parc*",
      required: true,
      description: "Nom unique du type de parc (obligatoire)",
    },
  ];

  return (
    <ExcelImport
      resourceType="typeparc"
      apiEndpoint="/api/typeparcs/import"
      resourceName="types de parc"
      resourceDescription="Importez des types de parc en masse à partir d'un fichier Excel"
      templateColumns={typeparcColumns}
      onImportComplete={onImportComplete}
      className={className}
    />
  );
}
