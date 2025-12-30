"use client";

import { API, apiFetch, methods } from "@/lib/api";
import { Save } from "lucide-react";
import React, { useEffect } from "react";
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
} from "@/components/ui/dialog";
import { useForm } from "@tanstack/react-form";
import * as yup from "yup";
import { fr, ar } from "yup-locales";
import { FieldGroup } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import FormError from "@/components/form/FormError";

interface EditTypepanneProps {
  typepanne: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditTypepanne = ({
  typepanne,
  open,
  onOpenChange,
}: EditTypepanneProps) => {
  const router = useRouter();
  const locale = useCurrentLocale();
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const typepanneSchema = React.useMemo(() => {
    if (locale === "ar") yup.setLocale(ar);
    else yup.setLocale(fr);
    return yup.object({
      name: yup.string().min(2).required().label("Nom du type de panne"),
      description: yup.string().label("Description"),
    });
  }, [locale]);

  const form = useForm({
    defaultValues: {
      name: typepanne?.name || "",
      description: typepanne?.description || "",
    },
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true);
        setError(null);
        await typepanneSchema.validate(value, { abortEarly: false });

        const response = await apiFetch(
          API.TYPEPANNES.TYPEPANNE_UPDATE(typepanne.id),
          {
            method: methods.PATCH,
            body: value,
          }
        );

        if (response.ok) {
          router.refresh();
          toast.success(`Type de panne mis à jour`);
          onOpenChange(false);
        } else {
          setError(response.data?.message || "Erreur lors de la mise à jour");
        }
      } catch (err: any) {
        if (err.name === "ValidationError") setError(err.errors.join(", "));
        else setError(err.message || "Erreur lors de la mise à jour");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (open && typepanne) {
      form.reset();
      form.setFieldValue("name", typepanne.name);
      form.setFieldValue("description", typepanne.description || "");
      setError(null);
    }
  }, [open, typepanne, form]);

  return (
    <Dialog open={open} onOpenChange={(o) => !isSubmitting && onOpenChange(o)}>
      <DialogContent className="sm:max-w-[450px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Modifier le type de panne</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations de ce type.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4 py-4">
            <FormError error={error} />
            <FormField
              form={form}
              name="name"
              label="Nom du type"
              placeholder="ex: Panne mécanique"
              disabled={isSubmitting}
            />
            <FormField
              form={form}
              name="description"
              label="Description (optionnelle)"
              placeholder="ex: Problèmes liés aux composants mécaniques"
              disabled={isSubmitting}
            />
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              size="sm"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting} size="sm">
              {isSubmitting ? (
                <Spinner className="h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTypepanne;
