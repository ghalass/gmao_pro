// hooks/useRegisterForm.ts
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import * as React from "react";
import * as yup from "yup";
import { fr, ar } from "yup-locales";
import { useCurrentLocale, useScopedI18n } from "@/locales/client";
import { API, apiFetch } from "@/lib/api";
import { ROUTE } from "@/lib/routes";

export function useRegisterForm() {
  const router = useRouter();
  const locale = useCurrentLocale();

  // Utiliser useScopedI18n pour les namespaces
  const registerT = useScopedI18n("pages.register");

  const [error, setError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Créer le schéma avec traductions
  const registerSchema = React.useMemo(() => {
    // Définir la locale Yup
    if (locale === "ar") {
      yup.setLocale(ar);
    } else {
      yup.setLocale(fr);
    }

    return yup.object({
      entrepriseName: yup
        .string()
        .min(3)
        .required()
        .label(registerT("entrepriseName")),
      name: yup.string().min(3).required().label(registerT("name")),
      email: yup.string().email().required().label(registerT("email")),
      password: yup.string().min(6).required().label(registerT("password")),
      lang: yup.string().required().label(registerT("lang.label")),
    });
  }, [locale, registerT]);

  // Fonction d'inscription
  const registerWithAllData = React.useCallback(
    async (
      entrepriseName: string,
      name: string,
      email: string,
      password: string,
      lang: string
    ) => {
      return apiFetch(API.AUTH.REGISTER, {
        method: "POST",
        body: {
          entrepriseName,
          name,
          email,
          password,
          lang,
        },
      });
    },
    []
  );

  const form = useForm({
    defaultValues: {
      entrepriseName: "",
      name: "",
      email: "",
      password: "",
      lang: locale,
    },
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true);
        await registerSchema.validate(value, { abortEarly: false });

        // Utiliser la fonction d'inscription
        const response = await registerWithAllData(
          value.entrepriseName,
          value.name,
          value.email,
          value.password,
          value.lang
        );

        if (response.ok) {
          toast.success("Application créée avec succès");
          router.push(ROUTE.AUTH.LOGIN);
        } else {
          const errorData = response.data?.message;
          console.error(errorData);
          setError(errorData);
        }
      } catch (err: any) {
        console.error("Erreur d'inscription:", err);
        if (err.name === "ValidationError" && err.errors) {
          setError(err.errors.join(", "));
        } else if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError(err.message || "Erreur lors d'inscription");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Fonction de validation pour chaque champ
  const validateField = React.useCallback(
    (fieldName: string, value: any) => {
      try {
        registerSchema.validateSyncAt(fieldName, { [fieldName]: value });
        return undefined;
      } catch (err: any) {
        return err.message;
      }
    },
    [registerSchema]
  );

  return { form, error, setError, isSubmitting, validateField };
}
