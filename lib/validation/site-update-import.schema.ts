import * as yup from "yup";
import { prisma } from "@/lib/prisma";

// Schéma pour la validation d'importation de modification de site
const SiteUpdateImportSchema = yup.object({
  name: yup.string().required("Le nom du site est obligatoire"),
  active: yup.mixed().optional(),
  entrepriseName: yup.string().optional(),
});

export type SiteUpdateImportData = yup.InferType<typeof SiteUpdateImportSchema>;

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

export interface SiteUpdateImportResult {
  success: boolean;
  message: string;
  data?: any[];
  errors?: ImportError[];
  summary?: ImportSummary;
}

export async function validateSiteUpdateImportData(
  data: any[],
  entrepriseId: string
): Promise<{ valid: SiteUpdateImportData[]; errors: ImportError[] }> {
  const valid: SiteUpdateImportData[] = [];
  const errors: ImportError[] = [];

  // Récupérer les sites existants pour validation
  const existingSites = await prisma.site.findMany({
    where: { entrepriseId },
    select: { id: true, name: true },
  });

  const existingSiteNames = new Map(
    existingSites.map((site) => [site.name.toLowerCase(), site.id])
  );

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 2; // Excel row number (starting from 2)

    try {
      // Validation du schéma de base avec Yup
      const parsed = await SiteUpdateImportSchema.validate(row, {
        abortEarly: false,
      });

      // Validation personnalisée
      if (!parsed.name || parsed.name.trim() === "") {
        errors.push({
          row: rowNumber,
          field: "name",
          value: parsed.name,
          message: "Le nom du site est obligatoire",
          severity: "error",
        });
        continue;
      }

      // Vérifier si le site existe par nom
      const siteName = parsed.name.trim();
      const existingSiteId = existingSiteNames.get(siteName.toLowerCase());

      if (!existingSiteId) {
        errors.push({
          row: rowNumber,
          field: "name",
          value: parsed.name,
          message: "Aucun site trouvé avec ce nom",
          severity: "error",
        });
        continue;
      }

      // Ajouter l'ID du site existant pour la modification
      (parsed as any).siteId = existingSiteId;

      // Validation du nom si fourni (pour renommage)
      const newName = parsed.name?.trim();
      if (newName && newName !== siteName) {
        if (newName.length < 2) {
          errors.push({
            row: rowNumber,
            field: "name",
            value: parsed.name,
            message: "Le nom du site doit contenir au moins 2 caractères",
            severity: "error",
          });
          continue;
        }

        // Vérifier si le nouveau nom est déjà utilisé par un autre site
        const existingSiteWithSameName = existingSiteNames.get(
          newName.toLowerCase()
        );
        if (
          existingSiteWithSameName &&
          existingSiteWithSameName !== existingSiteId
        ) {
          errors.push({
            row: rowNumber,
            field: "name",
            value: parsed.name,
            message: "Un site avec ce nom existe déjà",
            severity: "error",
          });
          continue;
        }
      }

      // Normalisation du champ active
      if (parsed.active !== undefined && parsed.active !== null) {
        if (typeof parsed.active === "string") {
          const activeStr = parsed.active.toLowerCase().trim();
          if (["true", "1", "oui", "yes"].includes(activeStr)) {
            parsed.active = true;
          } else if (["false", "0", "non", "no"].includes(activeStr)) {
            parsed.active = false;
          } else {
            errors.push({
              row: rowNumber,
              field: "active",
              value: parsed.active,
              message:
                "Valeur invalide pour 'Actif'. Utilisez true/false, oui/non, 1/0",
              severity: "error",
            });
            continue;
          }
        } else if (typeof parsed.active === "number") {
          parsed.active = parsed.active === 1;
        }
      }

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
