import * as yup from "yup";

export interface TypepanneUpdateImportData {
  name: string; // Used as identifier
  newName?: string; // Optional new name
}

export interface TypepanneUpdateImportResult {
  success: boolean;
  message: string;
  data?: TypepanneUpdateImportData[];
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

export const typepanneUpdateImportSchema: yup.ObjectSchema<TypepanneUpdateImportData> =
  yup.object({
    name: yup
      .string()
      .required("Le nom du type de panne à modifier est obligatoire")
      .min(1, "Le nom ne peut pas être vide"),

    newName: yup
      .string()
      .optional()
      .min(2, "Le nouveau nom doit contenir au moins 2 caractères")
      .max(100, "Le nouveau nom ne peut pas dépasser 100 caractères")
      .matches(
        /^[a-zA-Z0-9\s\-_À-ÿ]+$/,
        "Le nouveau nom contient des caractères non valides"
      ),
  });

export const validateTypepanneUpdateImportData = async (
  data: any[],
  entrepriseId: string
): Promise<{ valid: TypepanneUpdateImportData[]; errors: ImportError[] }> => {
  const errors: ImportError[] = [];
  const valid: TypepanneUpdateImportData[] = [];

  for (let index = 0; index < data.length; index++) {
    const row = data[index];
    const rowNumber = index + 2; // Excel rows start at 1, header is row 1

    try {
      // Skip empty rows
      if (!row || Object.keys(row).every((key) => !row[key])) {
        continue;
      }

      // Validate and transform data
      const validatedData = await typepanneUpdateImportSchema.validate(row, {
        abortEarly: false,
        stripUnknown: true,
      });

      // Add entrepriseId to data
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

export const generateUpdateExcelTemplate = (existingData: any[]) => {
  const template = existingData.map((item, index) => ({
    "Nom*": item.name,
    "Nouveau nom": index === 0 ? "Nouveau nom exemple" : "",
  }));

  return template.length > 0
    ? template
    : [
        {
          "Nom*": "Type de panne existant",
          "Nouveau nom": "Nouveau nom modifié",
        },
      ];
};
