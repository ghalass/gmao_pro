"use client";

import { ExcelImport } from "@/components/ExcelImport";

interface SiteImportResult {
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

interface SiteImportProps {
  onImportComplete?: (result: SiteImportResult) => void;
  className?: string;
}

export function SiteImport({ onImportComplete, className }: SiteImportProps) {
  const siteColumns = [
    {
      name: "Nom du site",
      required: true,
      description: "Nom unique du site (obligatoire)",
    },
    {
      name: "Actif",
      required: false,
      description: "Statut du site (true/false, oui/non, 1/0)",
    },
    {
      name: "Entreprise",
      required: false,
      description: "Nom de l'entreprise (optionnel, pour multi-entreprises)",
    },
  ];

  return (
    <ExcelImport
      resourceType="site"
      apiEndpoint="/api/sites/import"
      resourceName="sites"
      resourceDescription="Importez des sites en masse à partir d'un fichier Excel"
      templateColumns={siteColumns}
      onImportComplete={onImportComplete}
      className={className}
    />
  );
}
