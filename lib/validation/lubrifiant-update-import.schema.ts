import * as yup from "yup";

export interface LubrifiantUpdateImportData {
  name: string; // Used as identifier
  newName?: string; // Optional new name
  typelubrifiantName?: string; // Optional new type
}

export interface LubrifiantUpdateImportResult {
  success: boolean;
  message: string;
  data?: LubrifiantUpdateImportData[];
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

export const lubrifiantUpdateImportSchema: yup.ObjectSchema<LubrifiantUpdateImportData> =
  yup.object({
    name: yup
      .string()
      .required("Le nom du lubrifiant à modifier est obligatoire")
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

    typelubrifiantName: yup
      .string()
      .optional()
      .min(1, "Le type de lubrifiant ne peut pas être vide"),
  });

export const validateLubrifiantUpdateImportData = async (
  data: any[],
  entrepriseId: string
): Promise<{ valid: LubrifiantUpdateImportData[]; errors: ImportError[] }> => {
  const errors: ImportError[] = [];
  const valid: LubrifiantUpdateImportData[] = [];

  for (let index = 0; index < data.length; index++) {
    const row = data[index];
    const rowNumber = index + 2; // Excel rows start at 1, header is row 1

    try {
      // Skip empty rows
      if (!row || Object.keys(row).every((key) => !row[key])) {
        continue;
      }

      // Validate and transform data
      const validatedData = await lubrifiantUpdateImportSchema.validate(row, {
        abortEarly: false,
        stripUnknown: true,
      });

      // Add entrepriseId to data
      const lubrifiantData = {
        ...validatedData,
        entrepriseId,
      };

      valid.push(lubrifiantData);
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

export const generateUpdateExcelTemplate = (
  existingData: any[],
  typeLubrifiants: any[]
) => {
  const template = existingData.map((item, index) => ({
    "Nom*": item.name,
    "Nouveau nom": index === 0 ? "Nouveau nom exemple" : "",
    "Type lubrifiant":
      index === 0
        ? typeLubrifiants.length > 1
          ? typeLubrifiants[1].name
          : ""
        : "",
  }));

  return template.length > 0
    ? template
    : [
        {
          "Nom*": "Lubrifiant existant",
          "Nouveau nom": "Nouveau nom modifié",
          "Type lubrifiant":
            typeLubrifiants.length > 0
              ? typeLubrifiants[0].name
              : "Type Exemple",
        },
      ];
};
