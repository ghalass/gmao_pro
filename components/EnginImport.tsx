"use client";

import { ExcelImport } from "@/components/ExcelImport";

interface EnginImportResult {
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

interface EnginImportProps {
  onImportComplete?: (result: EnginImportResult) => void;
  className?: string;
}

export function EnginImport({ onImportComplete, className }: EnginImportProps) {
  const enginColumns = [
    {
      name: "Nom de l'engin",
      required: true,
      description: "Nom unique de l'engin (obligatoire)",
    },
    {
      name: "Site",
      required: true,
      description: "Nom du site où l'engin est affecté (obligatoire)",
    },
    {
      name: "Parc",
      required: true,
      description: "Nom du parc auquel appartient l'engin (obligatoire)",
    },
    {
      name: "Actif",
      required: false,
      description: "Statut de l'engin (true/false, oui/non, 1/0)",
    },
    {
      name: "Heures chassis initial",
      required: false,
      description: "Compteur d'heures initial de l'engin (optionnel)",
    },
  ];

  return (
    <ExcelImport
      resourceType="engin"
      apiEndpoint="/api/engins/import"
      resourceName="engins"
      resourceDescription="Importez des engins en masse à partir d'un fichier Excel"
      templateColumns={enginColumns}
      onImportComplete={onImportComplete}
      className={className}
    />
  );
}
