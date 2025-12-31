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

interface EditTypelubrifiantProps {
  typelubrifiant: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditTypelubrifiant = ({
  typelubrifiant,
  open,
  onOpenChange,
}: EditTypelubrifiantProps) => {
  const router = useRouter();
  const locale = useCurrentLocale();
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const typelubrifiantSchema = React.useMemo(() => {
    if (locale === "ar") yup.setLocale(ar);
    else yup.setLocale(fr);
    return yup.object({
      name: yup.string().min(2).required().label("Nom du type de lubrifiant"),
    });
  }, [locale]);

  const form = useForm({
    defaultValues: { name: typelubrifiant?.name || "" },
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true);
        setError(null);
        await typelubrifiantSchema.validate(value, { abortEarly: false });

        const response = await apiFetch(
          API.TYPELUBRIFIANTS.TYPELUBRIFIANT_UPDATE(typelubrifiant.id),
          {
            method: methods.PATCH,
            body: value,
          }
        );

        if (response.ok) {
          router.refresh();
          toast.success(`Type de lubrifiant mis à jour`);
          onOpenChange(false);
        } else {
          const errorData = response.data?.message;
          setError(errorData || "Erreur lors de la mise à jour");
          toast.error(errorData || "Erreur lors de la mise à jour");
        }
      } catch (err: any) {
        console.error("Erreur de modification:", err);
        if (err.name === "ValidationError") {
          setError(err.errors.join(", "));
          toast.error(err.errors.join(", "));
        } else {
          setError(err.message || "Erreur lors de la mise à jour");
          toast.error(err.message || "Erreur lors de la mise à jour");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (open && typelubrifiant) {
      form.reset({
        name: typelubrifiant.name,
      });
      setError(null);
    } else {
      setError(null);
      form.reset();
    }
  }, [open, typelubrifiant, form]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setError(null);
    }

    if (!isSubmitting) {
      onOpenChange(open);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Modifier le type de lubrifiant</DialogTitle>
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
              placeholder="ex: Huile moteur"
              disabled={isSubmitting}
            />
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setError(null);
                form.reset();
                onOpenChange(false);
              }}
              disabled={isSubmitting}
              size="sm"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting} size="sm">
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Modification...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Save className="h-4 w-4" />
                  Enregistrer
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTypelubrifiant;
