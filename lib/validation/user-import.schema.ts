import * as yup from "yup";

export interface UserImportData {
  name: string;
  email: string;
  password?: string;
  roleId?: string;
  active?: boolean;
  isOwner?: boolean;
  isSuperAdmin?: boolean;
}

export interface UserImportResult {
  success: boolean;
  message: string;
  data?: UserImportData[];
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

export const userImportSchema: yup.ObjectSchema<UserImportData> = yup.object({
  name: yup
    .string()
    .required("Le nom de l'utilisateur est obligatoire")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .matches(
      /^[a-zA-ZÀ-ÿ\s\-_]+$/,
      "Le nom contient des caractères non valides"
    ),

  email: yup
    .string()
    .required("L'email est obligatoire")
    .email("L'email doit être valide")
    .max(255, "L'email ne peut pas dépasser 255 caractères"),

  password: yup
    .string()
    .optional()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre"
    ),

  active: yup
    .boolean()
    .default(true)
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
      return true; // Default to true if undefined
    }),

  isOwner: yup
    .boolean()
    .default(false)
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
      return false; // Default to false if undefined
    }),

  isSuperAdmin: yup
    .boolean()
    .default(false)
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
      return false; // Default to false if undefined
    }),

  roleId: yup
    .string()
    .optional()
    .transform((value) => value?.toString().trim() || ""),
});

export const validateUserImportData = async (
  data: any[],
  entrepriseId: string
): Promise<{ valid: UserImportData[]; errors: ImportError[] }> => {
  const errors: ImportError[] = [];
  const valid: UserImportData[] = [];

  for (let index = 0; index < data.length; index++) {
    const row = data[index];
    const rowNumber = index + 2; // Excel rows start at 1, header is row 1

    try {
      // Skip empty rows
      if (!row || Object.keys(row).every((key) => !row[key])) {
        continue;
      }

      // Validate and transform the data
      const validatedData = await userImportSchema.validate(row, {
        abortEarly: false,
        stripUnknown: true,
      });

      // Add entrepriseId to the data
      const userData = {
        ...validatedData,
        entrepriseId,
      };

      valid.push(userData);
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
      "Nom*": "Utilisateur Exemple 1",
      "Email*": "utilisateur1@example.com",
      "Mot de passe": "Password123",
      Actif: "true",
      Propriétaire: "false",
      "Super Admin": "false",
    },
    {
      "Nom*": "Utilisateur Exemple 2",
      "Email*": "utilisateur2@example.com",
      "Mot de passe": "Password456",
      Actif: "true",
      Propriétaire: "false",
      "Super Admin": "false",
    },
  ];

  return template;
};
