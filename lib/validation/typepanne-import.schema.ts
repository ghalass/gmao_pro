import * as yup from "yup";

export interface TypepanneImportData {
  name: string;
}

export interface TypepanneImportResult {
  success: boolean;
  message: string;
  data?: TypepanneImportData[];
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

export const typepanneImportSchema: yup.ObjectSchema<TypepanneImportData> =
  yup.object({
    name: yup
      .string()
      .required("Le nom du type de panne est obligatoire")
      .min(2, "Le nom doit contenir au moins 2 caractères")
      .max(100, "Le nom ne peut pas dépasser 100 caractères")
      .matches(
        /^[a-zA-Z0-9\s\-_À-ÿ]+$/,
        "Le nom contient des caractères non valides"
      ),
  });

export const validateTypepanneImportData = async (
  data: any[],
  entrepriseId: string
): Promise<{ valid: TypepanneImportData[]; errors: ImportError[] }> => {
  const errors: ImportError[] = [];
  const valid: TypepanneImportData[] = [];

  for (let index = 0; index < data.length; index++) {
    const row = data[index];
    const rowNumber = index + 2; // Excel rows start at 1, header is row 1

    try {
      // Skip empty rows
      if (!row || Object.keys(row).every((key) => !row[key])) {
        continue;
      }

      // Validate and transform the data
      const validatedData = await typepanneImportSchema.validate(row, {
        abortEarly: false,
        stripUnknown: true,
      });

      // Add entrepriseId to the data
      const typepanneData = {
        ...validatedData,
        entrepriseId,
      };

      valid.push(typepanneData);
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
      "Nom*": "Type de panne Exemple 1",
    },
    {
      "Nom*": "Type de panne Exemple 2",
    },
  ];

  return template;
};
