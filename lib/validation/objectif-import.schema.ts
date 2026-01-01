import * as yup from "yup";

export interface ObjectifImportData {
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

// Schéma de validation pour l'importation des objectifs
export const objectifImportSchema: yup.ObjectSchema<ObjectifImportData> =
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

// Fonction pour générer le template Excel
export const generateObjectifExcelTemplate = () => {
  const template = [
    {
      "Année*": new Date().getFullYear(),
      "Parc*": "Parc Exemple",
      "Site*": "Site Exemple",
      Dispo: 95,
      MTBF: 8760,
      TDM: 5,
      "Spécification huile": 500,
      "Spécification GO": 200,
      "Spécification graisse": 100,
    },
    {
      "Année*": new Date().getFullYear(),
      "Parc*": "Autre Parc",
      "Site*": "Autre Site",
      Dispo: 90,
      MTBF: 7200,
      TDM: 8,
      "Spécification huile": 450,
      "Spécification GO": 180,
      "Spécification graisse": 90,
    },
  ];

  return template;
};
