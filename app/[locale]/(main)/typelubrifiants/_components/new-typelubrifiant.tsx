"use client";

import { API, apiFetch, methods } from "@/lib/api";
import { Plus, Save } from "lucide-react";
import React, { useState, useEffect } from "react";
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

interface NewTypelubrifiantProps {
  onSuccess?: () => void;
}

const NewTypelubrifiant = ({ onSuccess }: NewTypelubrifiantProps) => {
  const [modalOpen, setModalOpen] = useState(false);
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
    defaultValues: { name: "" },
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true);
        setError(null);
        await typelubrifiantSchema.validate(value, { abortEarly: false });

        const response = await apiFetch(
          API.TYPELUBRIFIANTS.TYPELUBRIFIANT_CREATE,
          {
            method: methods.POST,
            body: value,
          }
        );

        if (response.ok) {
          router.refresh();
          toast.success(`Type de lubrifiant créé avec succès`);
          setModalOpen(false);
          form.reset();
          onSuccess?.();
        } else {
          const errorData = response.data?.message;
          setError(errorData || "Erreur lors de la création");
          toast.error(errorData || "Erreur lors de la création");
        }
      } catch (err: any) {
        console.error("Erreur de création:", err);
        if (err.name === "ValidationError") {
          setError(err.errors.join(", "));
          toast.error(err.errors.join(", "));
        } else {
          setError(err.message || "Erreur lors de la création");
          toast.error(err.message || "Erreur lors de la création");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (modalOpen) {
      form.reset();
      setError(null);
    } else {
      setError(null);
      form.reset();
    }
  }, [modalOpen, form]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setError(null);
    }

    if (!isSubmitting) {
      setModalOpen(open);
    }
  };

  return (
    <Dialog open={modalOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nouveau type de lubrifiant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Créer un nouveau type de lubrifiant</DialogTitle>
            <DialogDescription>
              Définissez une catégorie de lubrifiant (ex: Huile moteur, Graisse,
              etc.)
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
                setModalOpen(false);
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
                  Création...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Save className="h-4 w-4" />
                  Créer
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewTypelubrifiant;
