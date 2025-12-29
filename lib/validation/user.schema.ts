// lib/validation/register.schema.ts
import * as yup from "yup";
import { fr, ar } from "yup-locales";

// Fonction principale pour obtenir le schéma avec la locale
export const getUserSchema = (locale: string) => {
  // Définir la locale Yup en fonction de la langue
  switch (locale) {
    case "ar":
      yup.setLocale(ar);
      break;
    case "fr":
    default:
      yup.setLocale(fr);
      break;
  }

  // Retourner le schéma de validation
  return yup.object({
    email: yup.string().email("Email invalide").required("L'email est requis"),
    name: yup.string().required("Le nom est requis"),
    password: yup
      .string()
      .min(6, "Le mot de passe doit faire au moins 6 caractères")
      .required("Le mot de passe est requis"),
    roles: yup
      .array()
      .of(yup.string().required())
      .min(1, "Au moins un rôle est requis"),
    active: yup.boolean().default(true),
  });
};

// Type TypeScript
export type userCreateSchema = yup.InferType<ReturnType<typeof getUserSchema>>;
