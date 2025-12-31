"use client";

import { API, apiFetch, methods } from "@/lib/api";
import { Save } from "lucide-react";
import React, { useEffect, useCallback } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface EditTypeconsommationlubProps {
  typeconsommationlub: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const EditTypeconsommationlub = ({
  typeconsommationlub,
  open,
  onOpenChange,
  onSuccess,
}: EditTypeconsommationlubProps) => {
  const router = useRouter();
  const locale = useCurrentLocale();
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [parcs, setParcs] = useState<any[]>([]);
  const [isLoadingParcs, setIsLoadingParcs] = useState(false);

  const typeconsommationlubSchema = React.useMemo(() => {
    if (locale === "ar") yup.setLocale(ar);
    else yup.setLocale(fr);
    return yup.object({
      name: yup.string().min(2).required().label("Nom du type de consommation"),
      parcIds: yup
        .array()
        .of(yup.string().required())
        .min(1, "Au moins un parc doit être associé")
        .required()
        .label("Parcs"),
    });
  }, [locale]);

  // Fonction pour récupérer les parcs
  const getAllParcs = useCallback(async () => {
    try {
      setIsLoadingParcs(true);
      const response = await apiFetch(API.PARCS.ALL, {
        method: methods.GET,
      });

      if (response.ok && response.data) {
        setParcs(response.data);
      } else {
        console.error(
          "Erreur lors de la récupération des parcs:",
          response.data?.message
        );
        toast.error("Impossible de charger les parcs");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des parcs");
    } finally {
      setIsLoadingParcs(false);
    }
  }, []);

  const form = useForm({
    defaultValues: {
      name: typeconsommationlub?.name || "",
      parcIds:
        typeconsommationlub?.parcs?.map((p: any) => p.parc?.id || p.parcId) ||
        [],
    },
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true);
        setError(null);
        await typeconsommationlubSchema.validate(value, { abortEarly: false });

        // Détection de changements
        const originalParcIds =
          typeconsommationlub?.parcs?.map((p: any) => p.parc?.id || p.parcId) ||
          [];
        const hasChanges =
          value.name !== typeconsommationlub?.name ||
          JSON.stringify(value.parcIds?.sort()) !==
            JSON.stringify(originalParcIds?.sort());

        if (!hasChanges) {
          onOpenChange?.(false);
          return;
        }

        const response = await apiFetch(
          API.TYPECONSOMMATIONLUBS.UPDATE(typeconsommationlub.id),
          {
            method: methods.PATCH,
            body: {
              name: value.name,
              parcIds: value.parcIds,
            },
          }
        );

        if (response.ok) {
          router.refresh();
          toast.success(`Type de consommation mis à jour`);
          onOpenChange(false);
          onSuccess?.();
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
    if (open && typeconsommationlub) {
      form.reset({
        name: typeconsommationlub.name,
        parcIds:
          typeconsommationlub.parcs?.map((p: any) => p.parc?.id || p.parcId) ||
          [],
      });
      setError(null);
      getAllParcs();
    } else {
      setError(null);
      form.reset();
    }
  }, [open, typeconsommationlub, form, getAllParcs]);

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
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Modifier le type de consommation</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations de ce type et ses associations avec
              les parcs.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4 py-4">
            <FormError error={error} />
            <FormField
              form={form}
              name="name"
              label="Nom du type de consommation"
              placeholder="ex: Vidange, Remplissage, etc."
              disabled={isSubmitting}
            />

            {/* Section des parcs */}
            <div className="space-y-3">
              <div className="text-sm font-medium">
                Parcs associés <span className="text-red-500">*</span>
              </div>

              {isLoadingParcs ? (
                <div className="flex items-center justify-center py-4">
                  <Spinner className="h-5 w-5" />
                  <span className="ml-2">Chargement des parcs...</span>
                </div>
              ) : parcs.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Aucun parc disponible
                </div>
              ) : (
                <form.Field
                  name="parcIds"
                  children={(field) => {
                    const selectedParcs = field.state.value || [];

                    // Fonction pour gérer la sélection/désélection d'un parc
                    const handleParcToggle = (
                      parcId: string,
                      checked: boolean
                    ) => {
                      if (checked) {
                        // Ajouter le parc
                        field.handleChange([...selectedParcs, parcId]);
                      } else {
                        // Retirer le parc
                        field.handleChange(
                          selectedParcs.filter((id: string) => id !== parcId)
                        );
                      }
                    };

                    return (
                      <>
                        <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto p-1">
                          {parcs
                            .filter((parc) => !!parc.id)
                            .map((parc) => (
                              <div
                                key={parc.id}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={`parc-${parc.id}-${typeconsommationlub.id}`}
                                  checked={selectedParcs.includes(parc.id)}
                                  onCheckedChange={(checked) =>
                                    handleParcToggle(parc.id, checked === true)
                                  }
                                  disabled={isSubmitting}
                                />
                                <Label
                                  htmlFor={`parc-${parc.id}-${typeconsommationlub.id}`}
                                  className="text-sm font-normal cursor-pointer flex-1"
                                >
                                  <div className="font-medium">{parc.name}</div>
                                  {parc.typeparc && (
                                    <div className="text-xs text-muted-foreground">
                                      {parc.typeparc.name}
                                    </div>
                                  )}
                                </Label>
                              </div>
                            ))}
                        </div>

                        {selectedParcs.length > 0 && (
                          <div className="text-sm text-muted-foreground mt-2">
                            {selectedParcs.length} parc(s) sélectionné(s)
                          </div>
                        )}
                      </>
                    );
                  }}
                />
              )}
            </div>
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
            <Button
              type="submit"
              disabled={isSubmitting || isLoadingParcs}
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

export default EditTypeconsommationlub;
