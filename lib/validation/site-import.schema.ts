import * as yup from "yup";

export interface SiteImportData {
  name: string;
  active?: boolean;
  entrepriseName?: string; // Pour référence à l'entreprise
}

export interface SiteImportResult {
  success: boolean;
  message: string;
  data?: SiteImportData[];
  errors?: ImportError[];
  summary?: ImportSummary;
}

export interface ImportError {
  row: number;
  field: string;
  value: any;
  message: string;
  severity: "error" | "warning";
}

export interface ImportSummary {
  total: number;
  created: number;
  updated: number;
  errors: number;
  warnings: number;
}

export const siteImportSchema: yup.ObjectSchema<SiteImportData> = yup.object({
  name: yup
    .string()
    .required("Le nom du site est obligatoire")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .matches(
      /^[a-zA-Z0-9\s\-_À-ÿ]+$/,
      "Le nom contient des caractères non valides"
    ),

  active: yup
    .boolean()
    .default(true)
    .transform((value) => {
      if (typeof value === "boolean") return value;
      if (typeof value === "string") {
        const lower = value.toLowerCase().trim();
        return (
          lower === "true" ||
          lower === "oui" ||
          lower === "yes" ||
          lower === "1"
        );
      }
      if (typeof value === "number") {
        return value === 1;
      }
      return true; // Default to true if undefined
    }),

  entrepriseName: yup
    .string()
    .optional()
    .max(100, "Le nom de l'entreprise ne peut pas dépasser 100 caractères"),
});

export const validateSiteImportData = async (
  data: any[],
  entrepriseId: string
): Promise<{ valid: SiteImportData[]; errors: ImportError[] }> => {
  const errors: ImportError[] = [];
  const valid: SiteImportData[] = [];

  for (let index = 0; index < data.length; index++) {
    const row = data[index];
    const rowNumber = index + 2; // Excel rows start at 1, header is row 1

    try {
      // Skip empty rows
      if (!row || Object.keys(row).every((key) => !row[key])) {
        continue;
      }

      // Validate and transform the data
      const validatedData = await siteImportSchema.validate(row, {
        abortEarly: false,
        stripUnknown: true,
      });

      // Add entrepriseId to the data
      const siteData = {
        ...validatedData,
        entrepriseId,
      };

      valid.push(siteData);
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        error.errors.forEach((message) => {
          const fieldMatch = message.match(/(\w+)/);
          const field = fieldMatch ? fieldMatch[1] : "unknown";

          errors.push({
            row: rowNumber,
            field,
            value: row[field],
            message,
            severity: "error",
          });
        });
      } else {
        errors.push({
          row: rowNumber,
          field: "general",
          value: row,
          message:
            error instanceof Error
              ? error.message
              : "Erreur de validation inconnue",
          severity: "error",
        });
      }
    }
  }

  return { valid, errors };
};

export const generateExcelTemplate = () => {
  const template = [
    {
      "Nom du site*": "Site Exemple",
      Actif: "true",
      "Entreprise (optionnel)": "Nom Entreprise",
    },
    {
      "Nom du site*": "Autre Site",
      Actif: "false",
      "Entreprise (optionnel)": "",
    },
  ];

  return template;
};
