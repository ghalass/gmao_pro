// hooks/useLoginForm.ts
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import * as React from "react";
import * as yup from "yup";
import { fr, ar } from "yup-locales";
import { useCurrentLocale, useScopedI18n } from "@/locales/client";
import { API, apiFetch, methods } from "@/lib/api";
import { ROUTE } from "@/lib/routes";
import { useUser } from "@/context/UserContext";

export function useLoginForm() {
  const router = useRouter();
  const locale = useCurrentLocale();
  const { refreshUser } = useUser();

  // Utiliser useScopedI18n pour les namespaces
  const loginT = useScopedI18n("pages.login");

  const [error, setError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Créer le schéma avec traductions
  const loginSchema = React.useMemo(() => {
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
        .label(loginT("entrepriseName")),
      email: yup.string().email().required().label(loginT("email")),
      password: yup.string().min(6).required().label(loginT("password")),
    });
  }, [locale, loginT]);

  // Fonction de connection
  const loginWithAllData = React.useCallback(
    async (entrepriseName: string, email: string, password: string) => {
      return apiFetch(API.AUTH.LOGIN, {
        method: methods.POST,
        body: {
          entrepriseName,
          email,
          password,
        },
      });
    },
    []
  );

  const form = useForm({
    defaultValues: {
      entrepriseName: "",
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true);
        await loginSchema.validate(value, { abortEarly: false });

        // Utiliser la fonction de connection
        const response = await loginWithAllData(
          value.entrepriseName,
          value.email,
          value.password
        );

        if (response.ok) {
          await refreshUser();
          toast.success("Connecté avec succès");
          router.push(ROUTE.DASHBOARD);
        } else {
          const errorData = response.data?.message;
          console.error(errorData);
          setError(errorData);
        }
      } catch (err: any) {
        console.error("Erreur de connection:", err);
        if (err.name === "ValidationError" && err.errors) {
          setError(err.errors.join(", "));
        } else if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError(err.message || "Erreur lors de connection");
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
        loginSchema.validateSyncAt(fieldName, { [fieldName]: value });
        return undefined;
      } catch (err: any) {
        return err.message;
      }
    },
    [loginSchema]
  );

  return { form, error, setError, isSubmitting, validateField };
}
