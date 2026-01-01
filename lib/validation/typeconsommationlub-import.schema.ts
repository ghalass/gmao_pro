import * as yup from "yup";

export interface TypeconsommationlubImportData {
  name: string;
}

export interface TypeconsommationlubImportResult {
  success: boolean;
  message: string;
  data?: TypeconsommationlubImportData[];
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

export const typeconsommationlubImportSchema: yup.ObjectSchema<TypeconsommationlubImportData> =
  yup.object({
    name: yup
      .string()
      .required("Le nom du type de consommation de lubrifiant est obligatoire")
      .min(2, "Le nom doit contenir au moins 2 caractères")
      .max(100, "Le nom ne peut pas dépasser 100 caractères")
      .matches(
        /^[a-zA-Z0-9\s\-_À-ÿ]+$/,
        "Le nom contient des caractères non valides"
      ),
  });

export const validateTypeconsommationlubImportData = async (
  data: any[],
  entrepriseId: string
): Promise<{
  valid: TypeconsommationlubImportData[];
  errors: ImportError[];
}> => {
  const errors: ImportError[] = [];
  const valid: TypeconsommationlubImportData[] = [];

  for (let index = 0; index < data.length; index++) {
    const row = data[index];
    const rowNumber = index + 2; // Excel rows start at 1, header is row 1

    try {
      // Skip empty rows
      if (!row || Object.keys(row).every((key) => !row[key])) {
        continue;
      }

      // Validate and transform the data
      const validatedData = await typeconsommationlubImportSchema.validate(
        row,
        {
          abortEarly: false,
          stripUnknown: true,
        }
      );

      // Add entrepriseId to the data
      const typeconsommationlubData = {
        ...validatedData,
        entrepriseId,
      };

      valid.push(typeconsommationlubData);
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
      "Nom du type*": "Huile Moteur",
    },
    {
      "Nom du type*": "Graissage",
    },
  ];

  return template;
};
