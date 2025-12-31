"use client";
import { API, apiFetch, methods } from "@/lib/api";
import { Plus, Save } from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/form/FormField";
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
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import FormError from "@/components/form/FormError";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import HierarchicalSelector from "./hierarchical-selector";

const NewOrgane = () => {
  const [modalOpen, setModalOpen] = useState(false);

  const router = useRouter();

  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      typeOrganeId: "",
      marque: "",
      sn: "",
      date_mes: "",
      origine: "",
      circuit: "",
      hrm_initial: 0,
      obs: "",
      active: true,
    },
    onSubmit: async ({ value }) => {
      // Validation manuelle avant envoi
      if (!value.name.trim()) {
        setError("Le nom est requis");
        return;
      }
      if (!value.typeOrganeId) {
        setError("Le type d'organe est requis");
        return;
      }

      try {
        setIsSubmitting(true);
        setError(null);

        const response = await apiFetch(API.ORGANES.ORGANE_CREATE, {
          method: methods.POST,
          body: value,
        });

        if (response.ok) {
          toast.success("Organe créé avec succès");
          setModalOpen(false);
          form.reset();
          router.refresh();
        } else {
          setError(response.data?.message || "Erreur lors de la création");
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Erreur lors de la création";
        setError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Réinitialiser le formulaire et l'erreur lors de la fermeture du dialog
  useEffect(() => {
    if (!modalOpen) {
      form.reset();
      setError(null);
    }
  }, [modalOpen, form]);

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel organe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-lg">Ajouter un organe</DialogTitle>
          <DialogDescription className="text-sm">
            Créer un nouvel organe dans le système
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4">
            <FormField
              form={form}
              name="name"
              label="Nom de l'organe"
              placeholder="Nom de l'organe"
              disabled={isSubmitting}
            />

            {/* Sélecteur hiérarchique */}
            <div className="border rounded-lg p-3 bg-muted/20">
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">
                Sélection par hiérarchie
              </h4>
              <HierarchicalSelector
                selectedTypeOrganeId={form.state.values.typeOrganeId}
                onTypeOrganeChange={(typeOrganeId) => {
                  form.setFieldValue("typeOrganeId", typeOrganeId);
                }}
                disabled={isSubmitting}
                label="Type d'organe"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                form={form}
                name="marque"
                label="Marque"
                placeholder="Marque"
                disabled={isSubmitting}
              />

              <FormField
                form={form}
                name="sn"
                label="N° série"
                placeholder="Numéro de série"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                form={form}
                name="date_mes"
                label="Date MES"
                type="date"
                disabled={isSubmitting}
              />

              <form.Field name="origine">
                {(field) => (
                  <Field className="gap-1">
                    <FieldLabel htmlFor="origine" className="text-sm">
                      Origine
                    </FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Origine" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRC">BRC</SelectItem>
                        <SelectItem value="APPRO">APPRO</SelectItem>
                        <SelectItem value="AUTRE">AUTRE</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                form={form}
                name="circuit"
                label="Circuit"
                placeholder="Circuit"
                disabled={isSubmitting}
              />

              <FormField
                form={form}
                name="hrm_initial"
                label="HRM initial"
                type="number"
                placeholder="0"
                disabled={isSubmitting}
              />
            </div>

            <FormField
              form={form}
              name="obs"
              label="Observations"
              placeholder="Observations"
              disabled={isSubmitting}
            />

            <form.Field name="active">
              {(field) => (
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={field.state.value}
                    onChange={(e) => field.handleChange(e.target.checked)}
                    disabled={isSubmitting}
                    className="h-4 w-4"
                  />
                  <label htmlFor="active" className="text-sm font-medium">
                    Organe actif
                  </label>
                </div>
              )}
            </form.Field>
          </div>

          <FormError error={error} />

          <DialogFooter className="pt-4 gap-2">
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

export default NewOrgane;
