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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NewEntrepriseProps {
  onSuccess?: () => void;
}

const NewEntreprise = ({ onSuccess }: NewEntrepriseProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();
  const locale = useCurrentLocale();

  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const entrepriseSchema = React.useMemo(() => {
    if (locale === "ar") yup.setLocale(ar);
    else yup.setLocale(fr);
    return yup.object({
      name: yup.string().min(2).required().label("Nom de l'entreprise"),
      lang: yup.string().oneOf(["fr", "ar"]).required().label("Langue"),
      active: yup.boolean().default(true),
    });
  }, [locale]);

  const form = useForm({
    defaultValues: {
      name: "",
      lang: "fr",
      active: true,
    },
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true);
        setError(null);
        await entrepriseSchema.validate(value, { abortEarly: false });

        if (!value.name || value.name.trim() === "") {
          setError("Le nom de l'entreprise est requis");
          return;
        }

        const response = await apiFetch(API.ENTREPRISES.ENTREPRISE_CREATE, {
          method: methods.POST,
          body: value,
        });

        if (response.ok) {
          router.refresh();
          toast.success(`Entreprise créée avec succès`);
          setModalOpen(false);
          form.reset();
          onSuccess?.();
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
    } else {
      setError(null);
      form.reset();
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
          Nouvelle entreprise
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
            <DialogTitle>Créer une nouvelle entreprise</DialogTitle>
            <DialogDescription>
              Ajoutez une nouvelle entreprise à votre organisation.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4 py-4">
            <FormError error={error} />
            <FormField
              form={form}
              name="name"
              label="Nom de l'entreprise"
              placeholder="ex: Société ABC"
              disabled={isSubmitting}
            />

            <form.Field
              name="lang"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="lang">Langue</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={field.handleChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une langue" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            />

            <div className="flex items-center gap-2 pt-2">
              <form.Field
                name="active"
                children={(field) => (
                  <Switch
                    id="entreprise-active"
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                    disabled={isSubmitting}
                  />
                )}
              />
              <Label htmlFor="entreprise-active" className="cursor-pointer">
                Entreprise active
              </Label>
            </div>
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

export default NewEntreprise;
