import * as yup from "yup";

export interface EnginUpdateImportData {
  name: string; // Used as identifier
  newName?: string; // Optional new name
  active?: boolean;
  parcName?: string;
  siteName?: string;
  initialHeureChassis?: number;
}

export interface EnginUpdateImportResult {
  success: boolean;
  message: string;
  data?: EnginUpdateImportData[];
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

export const enginUpdateImportSchema: yup.ObjectSchema<EnginUpdateImportData> =
  yup.object({
    name: yup
      .string()
      .required("Le nom de l'engin à modifier est obligatoire")
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

    parcName: yup
      .string()
      .optional()
      .min(1, "Le nom du parc ne peut pas être vide"),

    siteName: yup
      .string()
      .optional()
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

export const validateEnginUpdateImportData = async (
  data: any[],
  entrepriseId: string
): Promise<{ valid: EnginUpdateImportData[]; errors: ImportError[] }> => {
  const errors: ImportError[] = [];
  const valid: EnginUpdateImportData[] = [];

  for (let index = 0; index < data.length; index++) {
    const row = data[index];
    const rowNumber = index + 2; // Excel rows start at 1, header is row 1

    try {
      // Skip empty rows
      if (!row || Object.keys(row).every((key) => !row[key])) {
        continue;
      }

      // Validate and transform the data
      const validatedData = await enginUpdateImportSchema.validate(row, {
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

export const generateUpdateExcelTemplate = (
  existingData: any[],
  parcs: any[],
  sites: any[]
) => {
  const template = existingData.map((item, index) => ({
    "Nom*": item.name,
    "Nouveau nom": index === 0 ? "Nouveau nom exemple" : "",
    Actif: item.active ? "true" : "false",
    Parc: item.parc?.name || "",
    Site: item.site?.name || "",
    "Heure chassis initiale": item.initialHeureChassis || "",
  }));

  return template.length > 0
    ? template
    : [
        {
          "Nom*": "Engin existant",
          "Nouveau nom": "Nouveau nom modifié",
          Actif: "true",
          Parc: parcs.length > 0 ? parcs[0].name : "Parc Exemple",
          Site: sites.length > 0 ? sites[0].name : "Site Exemple",
          "Heure chassis initiale": "1000.5",
        },
      ];
};
