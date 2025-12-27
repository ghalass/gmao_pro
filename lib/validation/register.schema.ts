// lib/validation/register.schema.ts
import * as yup from "yup";
import { fr, ar } from "yup-locales";

// Fonction principale pour obtenir le schéma avec la locale
export const getRegisterSchema = (locale: string) => {
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
    entrepriseName: yup.string().min(3).required().label("Nom de l'entreprise"),
    name: yup.string().min(3).required().label("Nom"),
    email: yup.string().email().required().label("Email"),
    password: yup.string().min(6).required().label("Mot de passe"),
    lang: yup.string().required().label("Langue"),
  });
};

// Type TypeScript
export type RegisterFormData = yup.InferType<
  ReturnType<typeof getRegisterSchema>
>;
