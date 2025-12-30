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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface NewParcProps {
  typeparcs: any[];
  pannes: any[];
}

const NewParc = ({ typeparcs, pannes }: NewParcProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();
  const locale = useCurrentLocale();

  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const parcSchema = React.useMemo(() => {
    if (locale === "ar") yup.setLocale(ar);
    else yup.setLocale(fr);
    return yup.object({
      name: yup.string().min(2).required().label("Nom du parc"),
      typeparcId: yup.string().required().label("Type de parc"),
      panneIds: yup.array().of(yup.string()).label("Pannes"),
    });
  }, [locale]);

  const form = useForm({
    defaultValues: {
      name: "",
      typeparcId: "",
      panneIds: [] as string[],
    },
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true);
        setError(null);
        await parcSchema.validate(value, { abortEarly: false });

        const response = await apiFetch(API.PARCS.PARC_CREATE, {
          method: methods.POST,
          body: value,
        });

        if (response.ok) {
          router.refresh();
          toast.success(`Parc créé avec succès`);
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
          Nouveau parc
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
            <DialogTitle>Créer un nouveau parc</DialogTitle>
            <DialogDescription>
              Ajoutez une subdivision de votre flotte d'engins.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4 py-4">
            <FormError error={error} />

            <FormField
              form={form}
              name="name"
              label="Nom du parc"
              placeholder="ex: Bulldozers"
              disabled={isSubmitting}
            />

            <div className="space-y-2">
              <Label>Type de parc</Label>
              <form.Field name="typeparcId">
                {(field) => (
                  <Select
                    disabled={isSubmitting}
                    onValueChange={field.handleChange}
                    value={field.state.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {typeparcs.map((tp) => (
                        <SelectItem key={tp.id} value={tp.id}>
                          {tp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </form.Field>
            </div>

            <div className="space-y-2">
              <Label>Pannes possibles</Label>
              <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto p-2 border rounded-md">
                <form.Field name="panneIds">
                  {(field) => (
                    <>
                      {pannes.map((panne) => (
                        <div
                          key={panne.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`panne-${panne.id}`}
                            checked={field.state.value?.includes(panne.id)}
                            onCheckedChange={(checked) => {
                              const current = field.state.value || [];
                              if (checked) {
                                field.handleChange([...current, panne.id]);
                              } else {
                                field.handleChange(
                                  current.filter(
                                    (id: string) => id !== panne.id
                                  )
                                );
                              }
                            }}
                            disabled={isSubmitting}
                          />
                          <Label
                            htmlFor={`panne-${panne.id}`}
                            className="text-sm cursor-pointer truncate"
                          >
                            {panne.name}
                          </Label>
                        </div>
                      ))}
                    </>
                  )}
                </form.Field>
              </div>
            </div>
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

export default NewParc;
