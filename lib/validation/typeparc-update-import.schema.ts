import * as yup from "yup";

export interface TypeparcUpdateImportData {
  name: string;
}

export interface TypeparcUpdateImportResult {
  success: boolean;
  message: string;
  data?: TypeparcUpdateImportData[];
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

export const typeparcUpdateImportSchema: yup.ObjectSchema<TypeparcUpdateImportData> =
  yup.object({
    name: yup
      .string()
      .required("Le nom du type de parc est obligatoire")
      .min(2, "Le nom doit contenir au moins 2 caractères")
      .max(100, "Le nom ne peut pas dépasser 100 caractères")
      .matches(
        /^[a-zA-Z0-9\s\-_À-ÿ]+$/,
        "Le nom contient des caractères non valides"
      ),
  });

// Fonction de validation pour l'importation de mise à jour
export const validateTypeparcUpdateImportData = async (
  data: any[]
): Promise<TypeparcUpdateImportResult> => {
  const errors: ImportError[] = [];
  const validData: TypeparcUpdateImportData[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 2; // +1 pour l'index 0, +1 pour l'en-tête

    try {
      const validatedRow = await typeparcUpdateImportSchema.validate(row, {
        abortEarly: false,
      });
      validData.push(validatedRow);
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

  const success = errors.length === 0;
  const message = success
    ? "Validation réussie"
    : `${errors.length} erreur(s) de validation trouvée(s)`;

  return {
    success,
    message,
    data: success ? validData : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
};

export const generateTypeparcUpdateExcelTemplate = () => {
  const template = [
    {
      "Nom du type de parc*": "Type A",
    },
    {
      "Nom du type de parc*": "Type B",
    },
  ];

  return template;
};
