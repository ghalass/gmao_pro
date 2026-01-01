import * as yup from "yup";

export interface UserUpdateImportData {
  email: string;
  name?: string;
  active?: boolean;
  isOwner?: boolean;
  isSuperAdmin?: boolean;
}

export interface UserUpdateImportResult {
  success: boolean;
  message: string;
  data?: UserUpdateImportData[];
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

export const userUpdateImportSchema: yup.ObjectSchema<UserUpdateImportData> =
  yup.object({
    email: yup
      .string()
      .required("L'email est obligatoire pour identifier l'utilisateur")
      .email("L'email doit être valide")
      .max(255, "L'email ne peut pas dépasser 255 caractères"),

    name: yup
      .string()
      .optional()
      .min(2, "Le nom doit contenir au moins 2 caractères")
      .max(100, "Le nom ne peut pas dépasser 100 caractères")
      .matches(
        /^[a-zA-ZÀ-ÿ\s\-_]+$/,
        "Le nom contient des caractères non valides"
      ),

    active: yup
      .boolean()
      .optional()
      .transform((value) => {
        if (typeof value === "boolean") return value;
        if (typeof value === "string") {
          const lower = value.toLowerCase().trim();
          return (
            lower === "true" ||
            lower === "oui" ||
            lower === "yes" ||
            lower === "1"
          );
        }
        if (typeof value === "number") {
          return value === 1;
        }
        return undefined;
      }),

    isOwner: yup
      .boolean()
      .optional()
      .transform((value) => {
        if (typeof value === "boolean") return value;
        if (typeof value === "string") {
          const lower = value.toLowerCase().trim();
          return (
            lower === "true" ||
            lower === "oui" ||
            lower === "yes" ||
            lower === "1"
          );
        }
        if (typeof value === "number") {
          return value === 1;
        }
        return undefined;
      }),

    isSuperAdmin: yup
      .boolean()
      .optional()
      .transform((value) => {
        if (typeof value === "boolean") return value;
        if (typeof value === "string") {
          const lower = value.toLowerCase().trim();
          return (
            lower === "true" ||
            lower === "oui" ||
            lower === "yes" ||
            lower === "1"
          );
        }
        if (typeof value === "number") {
          return value === 1;
        }
        return undefined;
      }),
  });

export const validateUserUpdateImportData = async (
  data: any[],
  entrepriseId: string
): Promise<{ valid: UserUpdateImportData[]; errors: ImportError[] }> => {
  const errors: ImportError[] = [];
  const valid: UserUpdateImportData[] = [];

  for (let index = 0; index < data.length; index++) {
    const row = data[index];
    const rowNumber = index + 2; // Excel rows start at 1, header is row 1

    try {
      // Skip empty rows
      if (!row || Object.keys(row).every((key) => !row[key])) {
        continue;
      }

      // Validate and transform the data
      const validatedData = await userUpdateImportSchema.validate(row, {
        abortEarly: false,
        stripUnknown: true,
      });

      valid.push(validatedData);
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

export const generateUpdateExcelTemplate = () => {
  const template = [
    {
      "Email*": "utilisateur1@example.com",
      Nom: "Nouveau nom",
      Actif: "true",
      Propriétaire: "false",
      "Super Admin": "false",
    },
    {
      "Email*": "utilisateur2@example.com",
      Nom: "Nouveau nom 2",
      Actif: "false",
      Propriétaire: "false",
      "Super Admin": "false",
    },
  ];

  return template;
};
