"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface ExportExcelProps {
  data?: any[];
  filename?: string;
  sheetName?: string;
  columns?: {
    key: string;
    header: string;
    formatter?: (value: any) => string;
  }[];
  onExportData?: () => Promise<any[]>;
  className?: string;
  disabled?: boolean;
}

export function ExportExcel({
  data,
  filename = "export",
  sheetName = "Données",
  columns,
  onExportData,
  className = "",
  disabled = false,
}: ExportExcelProps) {
  const [exporting, setExporting] = useState(false);

  const exportToExcel = async () => {
    try {
      setExporting(true);

      // Récupérer les données (soit directement, soit via onExportData)
      let exportData = data;
      if (onExportData) {
        exportData = await onExportData();
      }

      if (!exportData || exportData.length === 0) {
        toast.error("Aucune donnée à exporter");
        return;
      }

      // Importer XLSX dynamiquement pour éviter les erreurs SSR
      const XLSX = await import("xlsx");

      // Préparer les données
      let processedData = exportData;
      let headers: string[] = [];

      if (columns) {
        // Utiliser les colonnes personnalisées
        headers = columns.map((col) => col.header);
        processedData = exportData.map((item) => {
          const row: any = {};
          columns.forEach((col) => {
            const value = item[col.key];
            row[col.header] = col.formatter
              ? col.formatter(value)
              : value || "";
          });
          return row;
        });
      } else {
        // Utiliser toutes les clés du premier objet comme en-têtes
        if (exportData.length > 0) {
          headers = Object.keys(exportData[0]);
          processedData = exportData.map((item) => {
            const row: any = {};
            headers.forEach((header) => {
              row[header] = item[header] || "";
            });
            return row;
          });
        }
      }

      // Créer la feuille de calcul
      const worksheet = XLSX.utils.json_to_sheet(processedData, {
        header: headers,
      });

      // Ajuster la largeur des colonnes
      const colWidths = headers.map((header) => ({
        wch: Math.max(header.length, 15), // Minimum 15 caractères
      }));
      worksheet["!cols"] = colWidths;

      // Créer le classeur
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Générer le fichier Excel
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      // Télécharger le fichier
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Export réussi : ${exportData.length} éléments exportés`);
    } catch (error) {
      console.error("Erreur lors de l'export Excel:", error);
      toast.error("Erreur lors de l'export Excel");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={exportToExcel}
      disabled={disabled || exporting}
      className={`flex items-center gap-2 ${className}`}
    >
      <Download className="h-4 w-4" />
      {exporting ? "Export..." : "Exporter Excel"}
    </Button>
  );
}
