"use client";

import React, { useState } from "react";
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
import { FormField } from "@/components/form/FormField";
import { API, apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Save } from "lucide-react";

interface NewTypeparcProps {
  onSuccess?: () => void;
}

const NewTypeparc = ({ onSuccess }: NewTypeparcProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const locale = useCurrentLocale();
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Configuration de Yup pour la locale
  yup.setLocale(locale === "ar" ? ar : fr);

  const form = useForm({
    defaultValues: {
      name: "",
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const response = await apiFetch(API.TYPEPARCS.TYPEPARC_CREATE, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(value),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Erreur lors de la création");
        }

        toast.success("Type de parc créé avec succès");
        setModalOpen(false);
        form.reset();
        onSuccess?.();
      } catch (error: any) {
        console.error("Erreur lors de la création:", error);
        setError(error.message || "Erreur lors de la création du type de parc");
        toast.error(
          error.message || "Erreur lors de la création du type de parc"
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    validators: {
      onChange: yup.object({
        name: yup
          .string()
          .required("Le nom du type de parc est obligatoire")
          .min(2, "Le nom doit contenir au moins 2 caractères")
          .max(100, "Le nom ne peut pas dépasser 100 caractères")
          .matches(
            /^[a-zA-Z0-9\s\-_À-ÿ]+$/,
            "Le nom contient des caractères non valides"
          ),
      }),
    },
  });

  return (
    <Dialog
      open={modalOpen}
      onOpenChange={(o) => !isSubmitting && setModalOpen(o)}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nouveau type de parc
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
            <DialogTitle>Créer un nouveau type de parc</DialogTitle>
            <DialogDescription>
              Définissez une catégorie de parc (ex: Engins de chantier,
              Véhicules légers, etc.)
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4 py-4">
            <FormError error={error} />
            <FormField
              form={form}
              name="name"
              label="Nom du type"
              placeholder="ex: Engins de chantier"
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
                <Spinner className="h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Créer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewTypeparc;
