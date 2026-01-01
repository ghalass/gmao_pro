import * as yup from "yup";

export interface OrganeImportData {
  name: string;
  typeOrganeName: string;
  marque?: string;
  sn?: string;
  date_mes?: Date;
  origine?: "BRC" | "APPRO" | "AUTRE";
  circuit?: string;
  hrm_initial?: number;
  obs?: string;
  active?: boolean;
}

export interface OrganeImportResult {
  success: boolean;
  message: string;
  data?: OrganeImportData[];
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

export const organeImportSchema: yup.ObjectSchema<OrganeImportData> =
  yup.object({
    name: yup
      .string()
      .required("Le nom de l'organe est obligatoire")
      .min(2, "Le nom doit contenir au moins 2 caractères")
      .max(100, "Le nom ne peut pas dépasser 100 caractères")
      .matches(
        /^[a-zA-Z0-9\s\-_À-ÿ]+$/,
        "Le nom contient des caractères non valides"
      ),

    typeOrganeName: yup
      .string()
      .required("Le type d'organe est obligatoire")
      .min(1, "Le type d'organe ne peut pas être vide"),

    marque: yup
      .string()
      .optional()
      .max(100, "La marque ne peut pas dépasser 100 caractères")
      .matches(
        /^[a-zA-Z0-9\s\-_À-ÿ]*$/,
        "La marque contient des caractères non valides"
      ),

    sn: yup
      .string()
      .optional()
      .max(100, "Le numéro de série ne peut pas dépasser 100 caractères")
      .matches(
        /^[a-zA-Z0-9\s\-_]*$/,
        "Le numéro de série contient des caractères non valides"
      ),

    date_mes: yup
      .date()
      .optional()
      .transform((value) => {
        if (!value) return undefined;

        // Handle different date formats
        if (typeof value === "string") {
          // Try DD/MM/YYYY format first
          const ddmmyyyy = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
          if (ddmmyyyy) {
            const [, day, month, year] = ddmmyyyy;
            return new Date(`${year}-${month}-${day}`);
          }

          // Try YYYY-MM-DD format
          const yyyymmdd = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (yyyymmdd) {
            return new Date(value);
          }

          // Try direct parsing
          const parsed = new Date(value);
          return isNaN(parsed.getTime()) ? undefined : parsed;
        }

        return value instanceof Date ? value : undefined;
      })
      .typeError("Format de date invalide (utilisez JJ/MM/AAAA)"),

    origine: yup
      .mixed<"BRC" | "APPRO" | "AUTRE">()
      .optional()
      .oneOf(
        ["BRC", "APPRO", "AUTRE"],
        "L'origine doit être BRC, APPRO ou AUTRE"
      ),

    circuit: yup
      .string()
      .optional()
      .max(100, "Le circuit ne peut pas dépasser 100 caractères")
      .matches(
        /^[a-zA-Z0-9\s\-_À-ÿ]*$/,
        "Le circuit contient des caractères non valides"
      ),

    hrm_initial: yup
      .number()
      .optional()
      .transform((value) => {
        if (value === "" || value === null || value === undefined)
          return undefined;
        const num = parseFloat(value);
        return isNaN(num) ? undefined : num;
      })
      .min(0, "L'HRM initial ne peut pas être négatif")
      .max(999999, "L'HRM initial est trop élevé"),

    obs: yup
      .string()
      .optional()
      .max(1000, "Les observations ne peuvent pas dépasser 1000 caractères"),

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
  });

export const validateOrganeImportData = async (
  data: any[],
  entrepriseId: string
): Promise<{ valid: OrganeImportData[]; errors: ImportError[] }> => {
  const errors: ImportError[] = [];
  const valid: OrganeImportData[] = [];

  for (let index = 0; index < data.length; index++) {
    const row = data[index];
    const rowNumber = index + 2; // Excel rows start at 1, header is row 1

    try {
      // Skip empty rows
      if (!row || Object.keys(row).every((key) => !row[key])) {
        continue;
      }

      // Validate and transform the data
      const validatedData = await organeImportSchema.validate(row, {
        abortEarly: false,
        stripUnknown: true,
      });

      // Add entrepriseId to the data
      const organeData = {
        ...validatedData,
        entrepriseId,
      };

      valid.push(organeData);
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

export const generateExcelTemplate = (typeOrganes: any[]) => {
  const template = [
    {
      "Nom*": "Organe Exemple 1",
      "Type organe*":
        typeOrganes.length > 0 ? typeOrganes[0].name : "Type Exemple",
      Marque: "Marque Exemple",
      "Numéro de série": "SN123456",
      "Date de mise en service": "15/01/2024",
      Origine: "BRC",
      Circuit: "Circuit A",
      "HRM initial": "1000.5",
      Observations: "Observations exemple",
      Actif: "true",
    },
    {
      "Nom*": "Organe Exemple 2",
      "Type organe*":
        typeOrganes.length > 0 ? typeOrganes[0].name : "Type Exemple",
      Marque: "",
      "Numéro de série": "",
      "Date de mise en service": "",
      Origine: "APPRO",
      Circuit: "",
      "HRM initial": "",
      Observations: "",
      Actif: "false",
    },
  ];

  return template;
};
