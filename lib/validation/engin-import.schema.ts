import * as yup from "yup";

export interface EnginImportData {
  name: string;
  active?: boolean;
  parcName?: string;
  siteName?: string;
  initialHeureChassis?: number;
}

export interface EnginImportResult {
  success: boolean;
  message: string;
  data?: EnginImportData[];
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

export const enginImportSchema: yup.ObjectSchema<EnginImportData> = yup.object({
  name: yup
    .string()
    .required("Le nom de l'engin est obligatoire")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .matches(
      /^[a-zA-Z0-9\s\-_À-ÿ]+$/,
      "Le nom contient des caractères non valides"
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

  parcName: yup
    .string()
    .required("Le nom du parc est obligatoire")
    .min(1, "Le nom du parc ne peut pas être vide"),

  siteName: yup
    .string()
    .required("Le nom du site est obligatoire")
    .min(1, "Le nom du site ne peut pas être vide"),

  initialHeureChassis: yup
    .number()
    .optional()
    .transform((value) => {
      if (value === "" || value === null || value === undefined)
        return undefined;
      const num = parseFloat(value);
      return isNaN(num) ? undefined : num;
    })
    .min(0, "L'heure chassis initiale ne peut pas être négative")
    .max(999999, "L'heure chassis initiale est trop élevée"),
});

export const validateEnginImportData = async (
  data: any[],
  entrepriseId: string
): Promise<{ valid: EnginImportData[]; errors: ImportError[] }> => {
  const errors: ImportError[] = [];
  const valid: EnginImportData[] = [];

  for (let index = 0; index < data.length; index++) {
    const row = data[index];
    const rowNumber = index + 2; // Excel rows start at 1, header is row 1

    try {
      // Skip empty rows
      if (!row || Object.keys(row).every((key) => !row[key])) {
        continue;
      }

      // Validate and transform the data
      const validatedData = await enginImportSchema.validate(row, {
        abortEarly: false,
        stripUnknown: true,
      });

      // Add entrepriseId to the data
      const enginData = {
        ...validatedData,
        entrepriseId,
      };

      valid.push(enginData);
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

export const generateExcelTemplate = (parcs: any[], sites: any[]) => {
  const template = [
    {
      "Nom*": "Engin Exemple 1",
      Actif: "true",
      "Parc*": parcs.length > 0 ? parcs[0].name : "Parc Exemple",
      "Site*": sites.length > 0 ? sites[0].name : "Site Exemple",
      "Heure chassis initiale": "1000.5",
    },
    {
      "Nom*": "Engin Exemple 2",
      Actif: "false",
      "Parc*": parcs.length > 0 ? parcs[0].name : "Parc Exemple",
      "Site*": sites.length > 0 ? sites[0].name : "Site Exemple",
      "Heure chassis initiale": "",
    },
  ];

  return template;
};
