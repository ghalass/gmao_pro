"use client";

import { ExcelImport } from "@/components/ExcelImport";

interface EnginUpdateImportResult {
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

interface EnginUpdateImportProps {
  onImportComplete?: (result: EnginUpdateImportResult) => void;
  className?: string;
}

export function EnginUpdateImport({
  onImportComplete,
  className,
}: EnginUpdateImportProps) {
  const enginUpdateColumns = [
    {
      name: "Nom*",
      required: true,
      description: "Nom existant de l'engin à modifier (obligatoire)",
    },
    {
      name: "Actif",
      required: false,
      description: "Nouveau statut de l'engin (true/false, oui/non, 1/0)",
    },
    {
      name: "Parc",
      required: false,
      description: "Nouveau parc associé",
    },
    {
      name: "Site",
      required: false,
      description: "Nouveau site associé",
    },
    {
      name: "Heure chassis initiale",
      required: false,
      description: "Nouvelle heure chassis initiale (nombre décimal)",
    },
  ];

  return (
    <ExcelImport
      resourceType="engin-update"
      apiEndpoint="/api/engins/update-import"
      resourceName="engins (modification)"
      resourceDescription="Modifiez des engins existants en masse à partir d'un fichier Excel"
      templateColumns={enginUpdateColumns}
      onImportComplete={onImportComplete}
      className={className}
    />
  );
}
