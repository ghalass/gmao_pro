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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useForm } from "@tanstack/react-form";
import * as yup from "yup";
import { fr, ar } from "yup-locales";
import { FieldGroup } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import FormError from "@/components/form/FormError";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface NewEnginProps {
  parcs: any[];
  sites: any[];
}

const NewEngin = ({ parcs, sites }: NewEnginProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();
  const locale = useCurrentLocale();

  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const enginSchema = React.useMemo(() => {
    if (locale === "ar") yup.setLocale(ar);
    else yup.setLocale(fr);
    return yup.object({
      name: yup.string().min(2).required().label("Nom de l'engin"),
      active: yup.boolean().default(true),
      parcId: yup.string().required().label("Parc"),
      siteId: yup.string().required().label("Site"),
      initialHeureChassis: yup
        .number()
        .min(0)
        .default(0)
        .label("Heures initiales"),
    });
  }, [locale]);

  const form = useForm({
    defaultValues: {
      name: "",
      active: true,
      parcId: "",
      siteId: "",
      initialHeureChassis: 0,
    },
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true);
        setError(null);
        await enginSchema.validate(value, { abortEarly: false });

        const response = await apiFetch(API.ENGINS.ENGIN_CREATE, {
          method: methods.POST,
          body: value,
        });

        if (response.ok) {
          router.refresh();
          toast.success(`Engin créé avec succès`);
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
          Nouvel engin
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Créer un nouvel engin</DialogTitle>
            <DialogDescription>
              Ajoutez un nouvel engin ou véhicule à votre flotte.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4 py-4">
            <FormError error={error} />

            <FormField
              form={form}
              name="name"
              label="Nom / Code de l'engin"
              placeholder="ex: CAT-001"
              disabled={isSubmitting}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Parc</Label>
                <form.Field name="parcId">
                  {(field) => (
                    <Select
                      disabled={isSubmitting}
                      onValueChange={field.handleChange}
                      value={field.state.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un parc" />
                      </SelectTrigger>
                      <SelectContent>
                        {parcs.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </form.Field>
              </div>

              <div className="space-y-2">
                <Label>Site actuel</Label>
                <form.Field name="siteId">
                  {(field) => (
                    <Select
                      disabled={isSubmitting}
                      onValueChange={field.handleChange}
                      value={field.state.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un site" />
                      </SelectTrigger>
                      <SelectContent>
                        {sites.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </form.Field>
              </div>
            </div>

            <FormField
              form={form}
              name="initialHeureChassis"
              label="Heures initiales (compteur)"
              type="number"
              placeholder="0"
              disabled={isSubmitting}
            />

            <div className="flex items-center gap-2 pt-2">
              <form.Field
                name="active"
                children={(field) => (
                  <Switch
                    id="engin-active"
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                    disabled={isSubmitting}
                  />
                )}
              />
              <Label htmlFor="engin-active" className="cursor-pointer">
                Engin actif
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

export default NewEngin;
