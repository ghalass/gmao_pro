import * as yup from "yup";

export interface EntrepriseImportData {
  name: string;
  lang: "fr" | "ar";
  active?: boolean;
}

export interface EntrepriseImportResult {
  success: boolean;
  message: string;
  data?: EntrepriseImportData[];
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

export const entrepriseImportSchema: yup.ObjectSchema<EntrepriseImportData> =
  yup.object({
    name: yup
      .string()
      .required("Le nom de l'entreprise est obligatoire")
      .min(2, "Le nom doit contenir au moins 2 caractères")
      .max(100, "Le nom ne peut pas dépasser 100 caractères")
      .matches(
        /^[a-zA-Z0-9\s\-_À-ÿ]+$/,
        "Le nom contient des caractères non valides"
      ),

    lang: yup
      .string()
      .oneOf(["fr", "ar"], "La langue doit être 'fr' ou 'ar'")
      .required("La langue est obligatoire")
      .transform((value) => {
        if (typeof value === "string") {
          const lower = value.toLowerCase().trim();
          if (lower === "fr" || lower === "français" || lower === "french")
            return "fr";
          if (lower === "ar" || lower === "arabe" || lower === "arabic")
            return "ar";
        }
        return value;
      }),

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
  });

export const validateEntrepriseImportData = async (
  data: any[]
): Promise<{ valid: EntrepriseImportData[]; errors: ImportError[] }> => {
  const errors: ImportError[] = [];
  const valid: EntrepriseImportData[] = [];

  for (let index = 0; index < data.length; index++) {
    const row = data[index];
    const rowNumber = index + 2; // Excel rows start at 1, header is row 1

    try {
      // Skip empty rows
      if (!row || Object.keys(row).every((key) => !row[key])) {
        continue;
      }

      // Validate and transform the data
      const validatedData = await entrepriseImportSchema.validate(row, {
        abortEarly: false,
        stripUnknown: true,
      });

      valid.push(validatedData);
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
      "Nom de l'entreprise*": "Société ABC",
      "Langue*": "fr",
      Actif: "true",
    },
    {
      "Nom de l'entreprise*": "شركة XYZ",
      "Langue*": "ar",
      Actif: "true",
    },
  ];

  return template;
};
