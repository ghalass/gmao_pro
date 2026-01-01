import * as XLSX from "xlsx";

export interface ExportColumn {
  key: string;
  header: string;
  formatter?: (value: any) => string;
}

export interface ExportOptions {
  filename?: string;
  sheetName?: string;
  columns?: ExportColumn[];
  includeTimestamp?: boolean;
}

export async function exportToExcel(
  data: any[],
  options: ExportOptions = {}
): Promise<void> {
  const {
    filename = "export",
    sheetName = "Données",
    columns,
    includeTimestamp = true,
  } = options;

  if (!data || data.length === 0) {
    throw new Error("Aucune donnée à exporter");
  }

  // Préparer les données
  let exportData = data;
  let headers: string[] = [];

  if (columns && columns.length > 0) {
    // Utiliser les colonnes personnalisées
    headers = columns.map((col) => col.header);
    exportData = data.map((item) => {
      const row: any = {};
      columns.forEach((col) => {
        const value = item[col.key];
        row[col.header] = col.formatter ? col.formatter(value) : value || "";
      });
      return row;
    });
  } else {
    // Utiliser toutes les clés du premier objet comme en-têtes
    if (data.length > 0) {
      headers = Object.keys(data[0]);
      exportData = data.map((item) => {
        const row: any = {};
        headers.forEach((header) => {
          row[header] = item[header] || "";
        });
        return row;
      });
    }
  }

  // Créer la feuille de calcul
  const worksheet = XLSX.utils.json_to_sheet(exportData, { header: headers });

  // Ajuster la largeur des colonnes
  const colWidths = headers.map((header) => ({
    wch: Math.max(header.length, 15), // Minimum 15 caractères
  }));
  worksheet["!cols"] = colWidths;

  // Ajouter des métadonnées
  if (includeTimestamp) {
    const metadata = [
      [`Exporté le : ${new Date().toLocaleString("fr-FR")}`],
      [`Nombre d'éléments : ${data.length}`],
      [""],
    ];
    XLSX.utils.sheet_add_aoa(worksheet, metadata, { origin: -1 });
  }

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
}

// Fonctions utilitaires pour formater les données
export const formatters = {
  boolean: (value: any) => (value ? "Oui" : "Non"),
  date: (value: any) => {
    if (!value) return "";
    return new Date(value).toLocaleDateString("fr-FR");
  },
  dateTime: (value: any) => {
    if (!value) return "";
    return new Date(value).toLocaleString("fr-FR");
  },
  currency: (value: any) => {
    if (!value) return "0 €";
    return `${parseFloat(value).toFixed(2)} €`;
  },
  number: (value: any, decimals = 2) => {
    if (!value) return "0";
    return parseFloat(value).toFixed(decimals);
  },
  percentage: (value: any) => {
    if (!value) return "0%";
    return `${parseFloat(value).toFixed(1)}%`;
  },
};
