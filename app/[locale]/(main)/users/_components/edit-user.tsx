// app/[locale]/(main)/users/_components/edit-user.tsx
"use client";
import { API, apiFetch, methods } from "@/lib/api";
import { User } from "@/lib/generated/prisma/client";
import { Save } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/form/FormField";
import { useCurrentLocale } from "@/locales/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useForm } from "@tanstack/react-form";
import * as yup from "yup";
import { fr, ar } from "yup-locales";
import { FieldGroup } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import FormError from "@/components/form/FormError";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FormCheckbox } from "@/components/form/FormCheckbox";

const EditUser = ({ user }: { user: User }) => {
  const [modalOpen, setModalOpen] = useState(false);

  const router = useRouter();
  const locale = useCurrentLocale();

  // Utiliser useScopedI18n pour les namespaces
  // const loginT = useScopedI18n("pages.login");

  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Créer le schéma avec traductions
  const editUserSchema = React.useMemo(() => {
    // Définir la locale Yup
    if (locale === "ar") {
      yup.setLocale(ar);
    } else {
      yup.setLocale(fr);
    }

    return yup.object({
      name: yup.string().min(3).required().label("Nom d'utilisateur"),
      email: yup.string().email().required().label("email"),
    });
  }, [locale]);

  // Fonction de connection
  const editUserWithAllData = React.useCallback(
    async (name: string, active: boolean) => {
      return apiFetch(API.USERS.USER_UPDATE(user.id), {
        method: methods.PATCH,
        body: { name, active },
      });
    },
    []
  );

  const form = useForm({
    defaultValues: {
      name: user?.name,
      email: user?.email,
      active: user?.active,
    },
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true);
        setError(null);
        await editUserSchema.validate(value, { abortEarly: false });

        // Utiliser la fonction de connection
        const response = await editUserWithAllData(value.name, value.active);

        if (response.ok) {
          router.refresh();
          toast.success(`Modifié avec succès`);
          setModalOpen(false);
        } else {
          const errorData = response.data?.message;
          setError(errorData);
          toast.error(errorData);
          console.error(errorData);
        }
      } catch (err: any) {
        console.error("Erreur de connection:", err);
        if (err.name === "ValidationError" && err.errors) {
          setError(err.errors.join(", "));
          toast.error(err.errors.join(", "));
        } else if (err.response?.data?.message) {
          setError(err.response.data.message);
          toast.error(err.response.data.message);
        } else {
          setError(err.message || "Erreur lors de connection");
          toast.error(err.message || "Erreur lors de connection");
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
        editUserSchema.validateSyncAt(fieldName, { [fieldName]: value });
        return undefined;
      } catch (err: any) {
        return err.message;
      }
    },
    [editUserSchema]
  );

  // Gérer la fermeture du modal
  const handleOpenChange = (open: boolean) => {
    setError(null);
    form.reset();
    if (!isSubmitting) {
      setModalOpen(open);
    }
    // Si isSubmitting est true, on ne permet pas la fermeture
  };

  return (
    <Dialog open={modalOpen} onOpenChange={handleOpenChange}>
      <form
        id="edit-user-form"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            Modifier
          </Button>
        </DialogTrigger>
        <DialogContent
          className="sm:max-w-[425px]"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Modifier</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you&apos;re
              done.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-1">
            <FormError error={error} />
            <FormField
              form={form}
              name="name"
              label="Nom"
              customValidator={(value) => validateField("name", value)}
              disabled={isSubmitting}
            />
            <FormCheckbox
              form={form}
              name="active"
              label="Utilisateur actif"
              disabled={isSubmitting}
            />
            <FormField
              form={form}
              name="email"
              label="Email"
              customValidator={(value) => validateField("email", value)}
              disabled
            />
          </FieldGroup>
          <DialogFooter>
            <div className="flex flex-row sm:flex-row gap-2 w-full">
              <Button
                type="submit"
                form="edit-user-form"
                disabled={isSubmitting}
                className="flex-1"
                size="sm"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner className="h-4 w-4" />
                    Modification...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Save className="h-4 w-4" />
                    Modifier
                  </span>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
};

export default EditUser;
