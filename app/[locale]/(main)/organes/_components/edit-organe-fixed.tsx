"use client";
import { API, apiFetch, methods } from "@/lib/api";
import { TypeOrgane } from "@/lib/generated/prisma/client";
import { Save } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
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
import { Organe } from "@/lib/generated/prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";

interface EditOrganeProps {
  organe: Organe & { type_organe: TypeOrgane };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditOrgane = ({ organe, open, onOpenChange }: EditOrganeProps) => {
  const [typeOrganes, setTypeOrganes] = useState<TypeOrgane[]>([]);
  const [isLoadingTypeOrganes, setIsLoadingTypeOrganes] = useState(false);

  const router = useRouter();
  const locale = useCurrentLocale();

  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Créer le schéma avec traductions
  const editOrganeSchema = React.useMemo(() => {
    if (locale === "ar") {
      yup.setLocale(ar);
    } else {
      yup.setLocale(fr);
    }

    return yup.object({
      name: yup.string().required("Le nom est requis"),
      typeOrganeId: yup.string().required("Le type d'organe est requis"),
      marque: yup.string().optional(),
      sn: yup.string().optional(),
      date_mes: yup.string().optional(),
      origine: yup.string().oneOf(["BRC", "APPRO", "AUTRE"]).optional(),
      circuit: yup.string().optional(),
      hrm_initial: yup.number().optional().min(0),
      obs: yup.string().optional(),
      active: yup.boolean().default(true),
    });
  }, [locale]);

  const form = useForm({
    defaultValues: {
      name: organe.name || "",
      typeOrganeId: organe.typeOrganeId || "",
      marque: organe.marque || "",
      sn: organe.sn || "",
      date_mes: organe.date_mes
        ? new Date(organe.date_mes).toISOString().split("T")[0]
        : "",
      origine: organe.origine || "",
      circuit: organe.circuit || "",
      hrm_initial: Number(organe.hrm_initial) || 0,
      obs: organe.obs || "",
      active: organe.active ?? true,
    },
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true);
        setError(null);

        const response = await apiFetch(API.ORGANES.ORGANE_UPDATE(organe.id), {
          method: methods.PUT,
          body: value,
        });

        if (response.ok) {
          toast.success("Organe modifié avec succès");
          onOpenChange(false);
          form.reset();
          router.refresh();
        } else {
          setError(response.data?.message || "Erreur lors de la modification");
        }
      } catch (err: any) {
        setError(err.message || "Erreur lors de la modification");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Charger les types d'organes depuis l'API
  const loadTypeOrganes = useCallback(async () => {
    try {
      setIsLoadingTypeOrganes(true);
      const response = await apiFetch(API.TYPEORGANES.ALL);
      if (response.ok) {
        setTypeOrganes(response.data || []);
      } else {
        console.error("Erreur API:", response.data);
        // Fallback vers données mockées en cas d'erreur
        const mockTypeOrganes: any[] = [
          { id: "1", name: "Moteur", entrepriseId: "mock-entreprise-id" },
          { id: "2", name: "Transmission", entrepriseId: "mock-entreprise-id" },
          { id: "3", name: "Hydraulique", entrepriseId: "mock-entreprise-id" },
          { id: "4", name: "Électrique", entrepriseId: "mock-entreprise-id" },
        ];
        setTypeOrganes(mockTypeOrganes);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des types d'organes:", error);
      // Fallback vers données mockées
      const mockTypeOrganes: any[] = [
        { id: "1", name: "Moteur", entrepriseId: "mock-entreprise-id" },
        { id: "2", name: "Transmission", entrepriseId: "mock-entreprise-id" },
        { id: "3", name: "Hydraulique", entrepriseId: "mock-entreprise-id" },
        { id: "4", name: "Électrique", entrepriseId: "mock-entreprise-id" },
      ];
      setTypeOrganes(mockTypeOrganes);
    } finally {
      setIsLoadingTypeOrganes(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadTypeOrganes();
    }
  }, [open, loadTypeOrganes]);

  // Réinitialiser l'erreur lors de la fermeture du dialog
  useEffect(() => {
    if (!open) {
      setError(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-96 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'organe</DialogTitle>
          <DialogDescription>
            Modifier les informations de l'organe
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <FormField
              form={form}
              name="name"
              label="Nom de l'organe"
              placeholder="..."
              disabled={isSubmitting}
            />

            <form.Field name="typeOrganeId">
              {(field) => (
                <Field className="gap-0.5">
                  <FieldLabel htmlFor="typeOrganeId">Type d'organe</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value)}
                    disabled={isSubmitting || isLoadingTypeOrganes}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type d'organe" />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOrganes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </form.Field>

            <FormField
              form={form}
              name="marque"
              label="Marque"
              placeholder="..."
              disabled={isSubmitting}
            />

            <FormField
              form={form}
              name="sn"
              label="Numéro de série"
              placeholder="..."
              disabled={isSubmitting}
            />

            <FormField
              form={form}
              name="date_mes"
              label="Date de mise en service"
              type="date"
              disabled={isSubmitting}
            />

            <form.Field name="origine">
              {(field) => (
                <Field className="gap-0.5">
                  <FieldLabel htmlFor="origine">Origine</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
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

            <FormField
              form={form}
              name="circuit"
              label="Circuit"
              placeholder="..."
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

            <FormField
              form={form}
              name="obs"
              label="Observations"
              placeholder="..."
              disabled={isSubmitting}
            />

            <form.Field name="active">
              {(field) => (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={field.state.value}
                    onChange={(e) => field.handleChange(e.target.checked)}
                    disabled={isSubmitting}
                  />
                  <label htmlFor="active" className="text-sm font-medium">
                    Actif
                  </label>
                </div>
              )}
            </form.Field>
          </FieldGroup>

          <FormError error={error} />

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
                <Spinner className="h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Modifier
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditOrgane;
