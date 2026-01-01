import * as yup from "yup";
import { prisma } from "@/lib/prisma";

// Schéma pour la validation d'importation de modification de type de lubrifiant
const TypelubrifiantUpdateImportSchema = yup.object({
  name: yup.string().required("Le nom du type de lubrifiant est obligatoire"),
});

export type TypelubrifiantUpdateImportData = yup.InferType<
  typeof TypelubrifiantUpdateImportSchema
>;

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

export interface TypelubrifiantUpdateImportResult {
  success: boolean;
  message: string;
  data?: any[];
  errors?: ImportError[];
  summary?: ImportSummary;
}

export async function validateTypelubrifiantUpdateImportData(
  data: any[],
  entrepriseId: string
): Promise<{ valid: TypelubrifiantUpdateImportData[]; errors: ImportError[] }> {
  const valid: TypelubrifiantUpdateImportData[] = [];
  const errors: ImportError[] = [];

  // Récupérer les types de lubrifiants existants pour validation
  const existingTypelubrifiants = await prisma.typelubrifiant.findMany({
    where: { entrepriseId },
    select: { id: true, name: true },
  });

  const existingTypelubrifiantNames = new Map(
    existingTypelubrifiants.map((typelubrifiant) => [
      typelubrifiant.name.toLowerCase(),
      typelubrifiant.id,
    ])
  );

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 2; // Excel row number (starting from 2)

    try {
      // Validation du schéma de base avec Yup
      const parsed = await TypelubrifiantUpdateImportSchema.validate(row, {
        abortEarly: false,
      });

      // Validation personnalisée
      if (!parsed.name || parsed.name.trim() === "") {
        errors.push({
          row: rowNumber,
          field: "name",
          value: parsed.name,
          message: "Le nom du type de lubrifiant est obligatoire",
          severity: "error",
        });
        continue;
      }

      // Vérifier si le type de lubrifiant existe par nom
      const typelubrifiantName = parsed.name.trim();
      const existingTypelubrifiantId = existingTypelubrifiantNames.get(
        typelubrifiantName.toLowerCase()
      );

      if (!existingTypelubrifiantId) {
        errors.push({
          row: rowNumber,
          field: "name",
          value: parsed.name,
          message: "Aucun type de lubrifiant trouvé avec ce nom",
          severity: "error",
        });
        continue;
      }

      // Ajouter l'ID du type de lubrifiant existant pour la modification
      (parsed as any).typelubrifiantId = existingTypelubrifiantId;

      valid.push(parsed);
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        error.inner.forEach((err: any) => {
          errors.push({
            row: rowNumber,
            field: err.path || "general",
            value: row[err.path || "general"],
            message: err.message,
            severity: "error",
          });
        });
      } else {
        errors.push({
          row: rowNumber,
          field: "general",
          value: row,
          message: "Erreur de validation générale",
          severity: "error",
        });
      }
    }
  }

  return { valid, errors };
}
