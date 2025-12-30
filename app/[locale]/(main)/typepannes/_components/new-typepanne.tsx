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

const NewTypepanne = () => {
  const [modalOpen, setModalOpen] = useState(false);
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
    defaultValues: { name: "", description: "" },
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true);
        setError(null);
        await typepanneSchema.validate(value, { abortEarly: false });

        const response = await apiFetch(API.TYPEPANNES.TYPEPANNE_CREATE, {
          method: methods.POST,
          body: value,
        });

        if (response.ok) {
          router.refresh();
          toast.success(`Type de panne créé avec succès`);
          setModalOpen(false);
          form.reset();
        } else {
          setError(response.data?.message || "Erreur lors de la création");
        }
      } catch (err: any) {
        if (err.name === "ValidationError") setError(err.errors.join(", "));
        else setError(err.message || "Erreur lors de la création");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (modalOpen) {
      form.reset();
      setError(null);
    }
  }, [modalOpen, form]);

  return (
    <Dialog
      open={modalOpen}
      onOpenChange={(o) => !isSubmitting && setModalOpen(o)}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nouveau type de panne
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
            <DialogTitle>Créer un nouveau type de panne</DialogTitle>
            <DialogDescription>
              Définissez une catégorie de panne (ex: Mécanique, Électrique,
              Hydraulique, etc.)
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
              onClick={() => setModalOpen(false)}
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

export default NewTypepanne;
