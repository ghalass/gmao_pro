import * as yup from "yup";

export interface PanneUpdateImportData {
  name: string; // Used as identifier
  newName?: string; // Optional new name
  typepanneName?: string; // Optional new type
  description?: string; // Optional new description
}

export interface PanneUpdateImportResult {
  success: boolean;
  message: string;
  data?: PanneUpdateImportData[];
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

export const panneUpdateImportSchema: yup.ObjectSchema<PanneUpdateImportData> =
  yup.object({
    name: yup
      .string()
      .required("Le nom de la panne à modifier est obligatoire")
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

    typepanneName: yup
      .string()
      .optional()
      .min(1, "Le type de panne ne peut pas être vide"),

    description: yup
      .string()
      .optional()
      .max(1000, "La description ne peut pas dépasser 1000 caractères"),
  });

export const validatePanneUpdateImportData = async (
  data: any[],
  entrepriseId: string
): Promise<{ valid: PanneUpdateImportData[]; errors: ImportError[] }> => {
  const errors: ImportError[] = [];
  const valid: PanneUpdateImportData[] = [];

  for (let index = 0; index < data.length; index++) {
    const row = data[index];
    const rowNumber = index + 2; // Excel rows start at 1, header is row 1

    try {
      // Skip empty rows
      if (!row || Object.keys(row).every((key) => !row[key])) {
        continue;
      }

      // Validate and transform data
      const validatedData = await panneUpdateImportSchema.validate(row, {
        abortEarly: false,
        stripUnknown: true,
      });

      // Add entrepriseId to data
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

export const generateUpdateExcelTemplate = (
  existingData: any[],
  typepannes: any[]
) => {
  const template = existingData.map((item, index) => ({
    "Nom*": item.name,
    "Nouveau nom": index === 0 ? "Nouveau nom exemple" : "",
    "Type panne": item.typepanne?.name || "",
    Description: item.description || "",
  }));

  return template.length > 0
    ? template
    : [
        {
          "Nom*": "Panne existante",
          "Nouveau nom": "Nouveau nom modifié",
          "Type panne":
            typepannes.length > 0 ? typepannes[0].name : "Type Exemple",
          Description: "Nouvelle description",
        },
      ];
};
