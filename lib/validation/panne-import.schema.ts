import * as yup from "yup";

export interface PanneImportData {
  name: string;
  typepanneName: string;
  description?: string;
}

export interface PanneImportResult {
  success: boolean;
  message: string;
  data?: PanneImportData[];
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

export const panneImportSchema: yup.ObjectSchema<PanneImportData> = yup.object({
  name: yup
    .string()
    .required("Le nom de la panne est obligatoire")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .matches(
      /^[a-zA-Z0-9\s\-_À-ÿ]+$/,
      "Le nom contient des caractères non valides"
    ),

  typepanneName: yup
    .string()
    .required("Le type de panne est obligatoire")
    .min(1, "Le type de panne ne peut pas être vide"),

  description: yup
    .string()
    .optional()
    .max(1000, "La description ne peut pas dépasser 1000 caractères"),
});

export const validatePanneImportData = async (
  data: any[],
  entrepriseId: string
): Promise<{ valid: PanneImportData[]; errors: ImportError[] }> => {
  const errors: ImportError[] = [];
  const valid: PanneImportData[] = [];

  for (let index = 0; index < data.length; index++) {
    const row = data[index];
    const rowNumber = index + 2; // Excel rows start at 1, header is row 1

    try {
      // Skip empty rows
      if (!row || Object.keys(row).every((key) => !row[key])) {
        continue;
      }

      // Validate and transform the data
      const validatedData = await panneImportSchema.validate(row, {
        abortEarly: false,
        stripUnknown: true,
      });

      // Add entrepriseId to the data
      const panneData = {
        ...validatedData,
        entrepriseId,
      };

      valid.push(panneData);
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

export const generateExcelTemplate = (typepannes: any[]) => {
  const template = [
    {
      "Nom*": "Panne Exemple 1",
      "Type panne*":
        typepannes.length > 0 ? typepannes[0].name : "Type Exemple",
      Description: "Description exemple",
    },
    {
      "Nom*": "Panne Exemple 2",
      "Type panne*":
        typepannes.length > 0 ? typepannes[0].name : "Type Exemple",
      Description: "",
    },
  ];

  return template;
};
