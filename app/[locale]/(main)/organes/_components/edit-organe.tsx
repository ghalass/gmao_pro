"use client";
import { API, apiFetch, methods } from "@/lib/api";
import { Organe, TypeOrgane } from "@/lib/generated/prisma/client";
import { Save } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/form/FormField";
import { FormCheckbox } from "@/components/form/FormCheckbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type OrganeWithType = Organe & {
  type_organe: TypeOrgane;
};

const EditOrgane = ({
  organe,
  open,
  onOpenChange,
  onSuccess,
}: {
  organe: OrganeWithType;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [typeOrganes, setTypeOrganes] = useState<TypeOrgane[]>([]);
  const [isLoadingTypeOrganes, setIsLoadingTypeOrganes] = useState(false);

  // Use external control if provided, otherwise internal
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const modalOpen = isControlled ? open : internalOpen;
  const setModalOpen = isControlled ? onOpenChange : setInternalOpen;

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
      name: yup.string().min(2).required().label("Nom de l'organe"),
      typeOrganeId: yup.string().required().label("Type d'organe"),
      marque: yup.string().optional().label("Marque"),
      sn: yup.string().optional().label("Numéro de série"),
      date_mes: yup.date().optional().label("Date de mesure"),
      origine: yup.string().optional().label("Origine"),
      circuit: yup.string().optional().label("Circuit"),
      hrm_initial: yup.number().min(0).label("HRM initial"),
      obs: yup.string().optional().label("Observations"),
      active: yup.boolean().label("Statut"),
    });
  }, [locale]);

  // Fonction pour récupérer les types d'organes
  const getAllTypeOrganes = useCallback(async () => {
    try {
      setIsLoadingTypeOrganes(true);
      const response = await apiFetch(API.TYPEORGANES.ALL, {
        method: methods.GET,
      });

      if (response.ok && response.data) {
        setTypeOrganes(response.data);
      } else {
        console.error(
          "Erreur lors de la récupération des types d'organes:",
          response.data?.message
        );
        toast.error("Impossible de charger les types d'organes");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des types d'organes");
    } finally {
      setIsLoadingTypeOrganes(false);
    }
  }, []);

  // Fonction de validation pour chaque champ
  const validateField = useCallback(
    (fieldName: string, value: any, context?: any) => {
      try {
        editOrganeSchema.validateSyncAt(fieldName, {
          [fieldName]: value,
          ...context,
        });
        return undefined;
      } catch (err: any) {
        return err.message;
      }
    },
    [editOrganeSchema]
  );

  // Fonction de modification d'organe
  const editOrganeResponse = useCallback(
    async (
      organeId: string,
      name: string,
      typeOrganeId: string,
      marque?: string,
      sn?: string,
      date_mes?: string,
      origine?: string | null,
      circuit?: string,
      hrm_initial?: number,
      obs?: string,
      active?: boolean
    ) => {
      const body: any = {
        name,
        typeOrganeId,
        marque,
        sn,
        date_mes,
        origine,
        circuit,
        hrm_initial,
        obs,
        active,
      };
      return apiFetch(API.ORGANES.ORGANE_UPDATE(organeId), {
        method: methods.PUT,
        body,
      });
    },
    []
  );

  const form = useForm({
    defaultValues: {
      name: organe?.name || "",
      typeOrganeId: organe?.typeOrganeId || "",
      marque: organe?.marque || "",
      sn: organe?.sn || "",
      date_mes: organe?.date_mes
        ? new Date(organe.date_mes).toISOString().split("T")[0]
        : "",
      origine: organe?.origine || "NONE",
      circuit: organe?.circuit || "",
      hrm_initial: Number(organe?.hrm_initial) || 0,
      obs: organe?.obs || "",
      active: organe?.active || false,
    },
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true);
        setError(null);
        await editOrganeSchema.validate(value, { abortEarly: false });

        // Vérifier si des modifications ont été faites
        const hasChanges =
          value.name !== organe?.name ||
          value.typeOrganeId !== organe?.typeOrganeId ||
          value.marque !== organe?.marque ||
          value.sn !== organe?.sn ||
          value.date_mes !==
            (organe?.date_mes
              ? new Date(organe.date_mes).toISOString().split("T")[0]
              : "") ||
          (value.origine === "NONE" ? null : value.origine) !==
            (organe?.origine || null) ||
          value.circuit !== organe?.circuit ||
          value.hrm_initial !== Number(organe?.hrm_initial) ||
          value.obs !== organe?.obs ||
          value.active !== organe?.active;

        if (!hasChanges) {
          onOpenChange?.(false);
          return;
        }

        // Utiliser la fonction de modification
        const response = await editOrganeResponse(
          organe.id,
          value.name,
          value.typeOrganeId,
          value.marque || undefined,
          value.sn || undefined,
          value.date_mes || undefined,
          value.origine === "NONE" ? null : value.origine || undefined,
          value.circuit || undefined,
          value.hrm_initial || 0,
          value.obs || undefined,
          value.active
        );

        if (response.ok) {
          router.refresh();
          toast.success(`Organe modifié avec succès`);
          setModalOpen(false);
          onSuccess?.();
        } else {
          const errorData = response.data?.message;
          setError(errorData);
          toast.error(errorData);
          console.error(errorData);
        }
      } catch (err: any) {
        console.error("Erreur de modification:", err);
        if (err.name === "ValidationError" && err.errors) {
          setError(err.errors.join(", "));
          toast.error(err.errors.join(", "));
        } else if (err.response?.data?.message) {
          setError(err.response.data.message);
          toast.error(err.response.data.message);
        } else {
          setError(err.message || "Erreur lors de la modification");
          toast.error(err.message || "Erreur lors de la modification");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Fonction de validation pour FormField
  const getFieldValidator = useCallback(
    (fieldName: string) => {
      return (value: any) => {
        return validateField(fieldName, value);
      };
    },
    [validateField]
  );

  // Réinitialiser le form quand le modal s'ouvre
  useEffect(() => {
    if (modalOpen) {
      form.reset({
        name: organe?.name || "",
        typeOrganeId: organe?.typeOrganeId || "",
        marque: organe?.marque || "",
        sn: organe?.sn || "",
        date_mes: organe?.date_mes
          ? new Date(organe.date_mes).toISOString().split("T")[0]
          : "",
        origine: organe?.origine || "NONE",
        circuit: organe?.circuit || "",
        hrm_initial: Number(organe?.hrm_initial) || 0,
        obs: organe?.obs || "",
        active: organe?.active || false,
      });
      setError(null);
    } else {
      setError(null);
      form.reset();
    }
  }, [modalOpen, organe, form]);

  // Charger les types d'organes quand le modal s'ouvre
  useEffect(() => {
    if (modalOpen) {
      getAllTypeOrganes();
    }
  }, [modalOpen, getAllTypeOrganes]);

  // Gérer la fermeture du modal
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
      <form
        id={`edit-organe-form-${organe.id}`}
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <DialogContent className="sm:max-w-150 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier l'organe</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'organe.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-1">
            <FormError error={error} />

            <FormField
              form={form}
              name="name"
              label="Nom de l'organe"
              customValidator={getFieldValidator("name")}
              disabled={isSubmitting}
            />

            <form.Field
              name="typeOrganeId"
              children={(field) => (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type d'organe</label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value)}
                    disabled={isSubmitting || isLoadingTypeOrganes}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type d'organe" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingTypeOrganes ? (
                        <div className="flex items-center justify-center p-2">
                          <Spinner className="h-4 w-4 mr-2" />
                          Chargement...
                        </div>
                      ) : typeOrganes.length === 0 ? (
                        <div className="text-sm text-muted-foreground p-2 text-center">
                          Aucun type d'organe disponible
                        </div>
                      ) : (
                        typeOrganes.map((typeOrgane) => (
                          <SelectItem key={typeOrgane.id} value={typeOrgane.id}>
                            {typeOrgane.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors.length > 0 && (
                    <div className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </div>
                  )}
                </div>
              )}
            />

            <FormField
              form={form}
              name="marque"
              label="Marque"
              customValidator={getFieldValidator("marque")}
              disabled={isSubmitting}
            />

            <FormField
              form={form}
              name="sn"
              label="Numéro de série"
              customValidator={getFieldValidator("sn")}
              disabled={isSubmitting}
            />

            <FormField
              form={form}
              name="date_mes"
              label="Date de mesure"
              type="date"
              customValidator={getFieldValidator("date_mes")}
              disabled={isSubmitting}
            />

            <form.Field
              name="origine"
              children={(field) => (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Origine</label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une origine" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Aucune</SelectItem>
                      <SelectItem value="BRC">BRC</SelectItem>
                      <SelectItem value="APPRO">APPRO</SelectItem>
                      <SelectItem value="AUTRE">AUTRE</SelectItem>
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors.length > 0 && (
                    <div className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </div>
                  )}
                </div>
              )}
            />

            <FormField
              form={form}
              name="circuit"
              label="Circuit"
              customValidator={getFieldValidator("circuit")}
              disabled={isSubmitting}
            />

            <FormField
              form={form}
              name="hrm_initial"
              label="HRM initial"
              type="number"
              customValidator={getFieldValidator("hrm_initial")}
              disabled={isSubmitting}
            />

            <FormField
              form={form}
              name="obs"
              label="Observations"
              customValidator={getFieldValidator("obs")}
              disabled={isSubmitting}
            />

            <FormCheckbox
              form={form}
              name="active"
              label="Organe actif"
              disabled={isSubmitting}
            />
          </FieldGroup>

          <DialogFooter>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
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
              <Button
                type="submit"
                form={`edit-organe-form-${organe.id}`}
                disabled={isSubmitting || isLoadingTypeOrganes}
                className="flex-1"
                size="sm"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner className="h-4 w-4" />
                    Modification...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Save className="h-4 w-4" />
                    Modifier
                  </span>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
};

export default EditOrgane;
