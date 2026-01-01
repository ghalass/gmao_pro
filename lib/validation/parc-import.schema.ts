import * as yup from "yup";
import { prisma } from "@/lib/prisma";

export interface ParcImportData {
  name: string;
  typeparcName: string;
}

export interface ParcImportResult {
  success: boolean;
  message: string;
  data?: ParcImportData[];
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

export const parcImportSchema: yup.ObjectSchema<ParcImportData> = yup.object({
  name: yup
    .string()
    .required("Le nom du parc est obligatoire")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .matches(
      /^[a-zA-Z0-9\s\-_À-ÿ]+$/,
      "Le nom contient des caractères non valides"
    ),

  typeparcName: yup
    .string()
    .required("Le type de parc est obligatoire")
    .min(2, "Le type de parc doit contenir au moins 2 caractères")
    .max(100, "Le type de parc ne peut pas dépasser 100 caractères"),
});

export const validateParcImportData = async (
  data: any[],
  entrepriseId: string
): Promise<{ valid: any[]; errors: ImportError[] }> => {
  const errors: ImportError[] = [];
  const valid: any[] = [];

  for (let index = 0; index < data.length; index++) {
    const row = data[index];
    const rowNumber = index + 2; // Excel rows start at 1, header is row 1

    try {
      // Skip empty rows
      if (!row || Object.keys(row).every((key) => !row[key])) {
        continue;
      }

      // Validate and transform the data
      const validatedData = await parcImportSchema.validate(row, {
        abortEarly: false,
        stripUnknown: true,
      });

      // Verify that typeparcName exists in the database
      const typeParc = await prisma.typeparc.findFirst({
        where: {
          name: validatedData.typeparcName,
          entrepriseId,
        },
      });

      if (!typeParc) {
        errors.push({
          row: rowNumber,
          field: "typeparcName",
          value: validatedData.typeparcName,
          message: `Le type de parc "${validatedData.typeparcName}" n'existe pas`,
          severity: "error",
        });
        continue;
      }

      // Add entrepriseId and typeparcId to the data
      const parcData = {
        ...validatedData,
        typeparcId: typeParc.id,
        entrepriseId,
      };

      valid.push(parcData);
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
      "Nom du parc*": "Parc Principal",
      "Type de parc*": "Type de parc exemple",
    },
    {
      "Nom du parc*": "Parc Secondaire",
      "Type de parc*": "Autre type",
    },
  ];

  return template;
};
