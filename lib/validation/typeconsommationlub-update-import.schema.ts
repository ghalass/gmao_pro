import * as yup from "yup";

export interface TypeconsommationlubUpdateImportData {
  name: string; // Used as identifier - nom existant
}

export interface TypeconsommationlubUpdateImportResult {
  success: boolean;
  message: string;
  data?: TypeconsommationlubUpdateImportData[];
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

export const typeconsommationlubUpdateImportSchema: yup.ObjectSchema<TypeconsommationlubUpdateImportData> =
  yup.object({
    name: yup
      .string()
      .required(
        "Le nom du type de consommation de lubrifiant à modifier est obligatoire"
      )
      .min(1, "Le nom ne peut pas être vide"),
  });

export const validateTypeconsommationlubUpdateImportData = async (
  data: any[],
  entrepriseId: string
): Promise<{
  valid: TypeconsommationlubUpdateImportData[];
  errors: ImportError[];
}> => {
  const errors: ImportError[] = [];
  const valid: TypeconsommationlubUpdateImportData[] = [];

  for (let index = 0; index < data.length; index++) {
    const row = data[index];
    const rowNumber = index + 2; // Excel rows start at 1, header is row 1

    try {
      // Skip empty rows
      if (!row || Object.keys(row).every((key) => !row[key])) {
        continue;
      }

      // Validate and transform the data
      const validatedData =
        await typeconsommationlubUpdateImportSchema.validate(row, {
          abortEarly: false,
          stripUnknown: true,
        });

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

export const generateUpdateExcelTemplate = (existingData: any[]) => {
  const template = existingData.map((item) => ({
    "Nom du type*": item.name,
  }));

  return template.length > 0
    ? template
    : [
        {
          "Nom du type*": "Type existant",
        },
      ];
};
