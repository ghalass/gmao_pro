"use client";

import { ExcelImport } from "@/components/ExcelImport";

interface SiteUpdateImportResult {
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

interface SiteUpdateImportProps {
  onImportComplete?: (result: SiteUpdateImportResult) => void;
  className?: string;
}

export function SiteUpdateImport({
  onImportComplete,
  className,
}: SiteUpdateImportProps) {
  const siteUpdateColumns = [
    {
      name: "Nom du site*",
      required: true,
      description: "Nom existant du site à modifier (obligatoire)",
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
      resourceType="site-update"
      apiEndpoint="/api/sites/update-import"
      resourceName="sites (modification)"
      resourceDescription="Modifiez des sites existants en masse à partir d'un fichier Excel"
      templateColumns={siteUpdateColumns}
      onImportComplete={onImportComplete}
      className={className}
    />
  );
}
