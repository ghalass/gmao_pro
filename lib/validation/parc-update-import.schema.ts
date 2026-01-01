import * as yup from "yup";
import { prisma } from "@/lib/prisma";

export interface ParcUpdateImportData {
  name: string;
  typeparcName?: string;
}

export interface ParcUpdateImportResult {
  success: boolean;
  message: string;
  data?: ParcUpdateImportData[];
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

export const parcUpdateImportSchema: yup.ObjectSchema<ParcUpdateImportData> =
  yup.object({
    name: yup
      .string()
      .required("Le nom du parc est obligatoire pour l'identification")
      .min(2, "Le nom doit contenir au moins 2 caractères")
      .max(100, "Le nom ne peut pas dépasser 100 caractères")
      .matches(
        /^[a-zA-Z0-9\s\-_À-ÿ]+$/,
        "Le nom contient des caractères non valides"
      ),

    typeparcName: yup
      .string()
      .optional()
      .min(2, "Le type de parc doit contenir au moins 2 caractères")
      .max(100, "Le type de parc ne peut pas dépasser 100 caractères"),
  });

export const validateParcUpdateImportData = async (
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
      const validatedData = await parcUpdateImportSchema.validate(row, {
        abortEarly: false,
        stripUnknown: true,
      });

      // Verify that the parc exists by name
      const existingParc = await prisma.parc.findFirst({
        where: {
          name: validatedData.name,
          entrepriseId,
        },
      });

      if (!existingParc) {
        errors.push({
          row: rowNumber,
          field: "name",
          value: validatedData.name,
          message: `Le parc "${validatedData.name}" n'existe pas`,
          severity: "error",
        });
        continue;
      }

      // If typeparcName is provided, verify it exists
      let typeparcId: string | undefined = existingParc.typeparcId;
      if (validatedData.typeparcName) {
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
        typeparcId = typeParc.id;
      }

      // Add entrepriseId and id for update
      const parcUpdateData = {
        ...validatedData,
        ...(validatedData.typeparcName && { typeparcId }),
        parcId: existingParc.id,
        entrepriseId,
      };

      valid.push(parcUpdateData);
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
      "Type de parc (optionnel)": "Nouveau type",
    },
    {
      "Nom du parc*": "Parc Secondaire",
      "Type de parc (optionnel)": "",
    },
  ];

  return template;
};
