import * as yup from "yup";

export interface ObjectifUpdateImportData {
  annee: number;
  parc: string;
  site: string;
  dispo?: number | null;
  mtbf?: number | null;
  tdm?: number | null;
  spe_huile?: number | null;
  spe_go?: number | null;
  spe_graisse?: number | null;
}

// Schéma de validation pour la modification par importation des objectifs
export const objectifUpdateImportSchema: yup.ObjectSchema<ObjectifUpdateImportData> =
  yup.object({
    annee: yup
      .number()
      .required("L'année est obligatoire")
      .integer("L'année doit être un nombre entier")
      .min(2000, "L'année doit être supérieure à 2000")
      .max(2100, "L'année doit être inférieure à 2100"),

    parc: yup
      .string()
      .required("Le parc est obligatoire")
      .min(1, "Le nom du parc ne peut pas être vide")
      .max(100, "Le nom du parc ne peut pas dépasser 100 caractères"),

    site: yup
      .string()
      .required("Le site est obligatoire")
      .min(1, "Le nom du site ne peut pas être vide")
      .max(100, "Le nom du site ne peut pas dépasser 100 caractères"),

    dispo: yup
      .number()
      .optional()
      .nullable()
      .min(0, "La disponibilité ne peut pas être négative")
      .max(100, "La disponibilité ne peut pas dépasser 100%"),

    mtbf: yup
      .number()
      .optional()
      .nullable()
      .min(0, "Le MTBF ne peut pas être négatif")
      .max(100000, "Le MTBF semble trop élevé"),

    tdm: yup
      .number()
      .optional()
      .nullable()
      .min(0, "Le TDM ne peut pas être négatif")
      .max(100, "Le TDM ne peut pas dépasser 100%"),

    spe_huile: yup
      .number()
      .optional()
      .nullable()
      .min(0, "La spécification huile ne peut pas être négative"),

    spe_go: yup
      .number()
      .optional()
      .nullable()
      .min(0, "La spécification GO ne peut pas être négative"),

    spe_graisse: yup
      .number()
      .optional()
      .nullable()
      .min(0, "La spécification graisse ne peut pas être négative"),
  });

// Fonction pour générer le template Excel de modification
export const generateObjectifUpdateExcelTemplate = (
  existingObjectifs: any[]
) => {
  const template = existingObjectifs.slice(0, 5).map((objectif) => ({
    "Année*": objectif.annee,
    "Parc*": objectif.parc?.name || "Parc existant",
    "Site*": objectif.site?.name || "Site existant",
    Dispo: objectif.dispo || "",
    MTBF: objectif.mtbf || "",
    TDM: objectif.tdm || "",
    "Spécification huile": objectif.spe_huile || "",
    "Spécification GO": objectif.spe_go || "",
    "Spécification graisse": objectif.spe_graisse || "",
  }));

  // Si aucun objectif existant, créer un exemple
  if (template.length === 0) {
    template.push({
      "Année*": new Date().getFullYear(),
      "Parc*": "Parc existant",
      "Site*": "Site existant",
      Dispo: "",
      MTBF: "",
      TDM: "",
      "Spécification huile": "",
      "Spécification GO": "",
      "Spécification graisse": "",
    });
  }

  return template;
};
