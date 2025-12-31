"use client";

import { API, apiFetch, methods } from "@/lib/api";
import {
  Saisiehim,
  Engin,
  Lubrifiant,
  Typeconsommationlub,
  Panne,
} from "@/lib/generated/prisma/client";
import { Save } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/form/FormField";
import { FormSelectField } from "@/components/form/FormSelectField";
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

interface AddSaisieLubrifiantProps {
  saisiehim: Saisiehim & { engin: Engin; panne?: Panne };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AddSaisieLubrifiant = ({
  saisiehim,
  open,
  onOpenChange,
  onSuccess,
}: AddSaisieLubrifiantProps) => {
  const [lubrifiants, setLubrifiants] = useState<
    (Lubrifiant & { typelubrifiant: any })[]
  >([]);
  const [typeConsommations, setTypeConsommations] = useState<
    Typeconsommationlub[]
  >([]);
  const [isLoadingLubrifiants, setIsLoadingLubrifiants] = useState(false);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);

  const router = useRouter();
  const locale = useCurrentLocale();

  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const schema = React.useMemo(() => {
    if (locale === "ar") {
      yup.setLocale(ar);
    } else {
      yup.setLocale(fr);
    }

    return yup.object({
      lubrifiantId: yup.string().required().label("Lubrifiant"),
      qte: yup.number().positive().required().label("Quantité"),
      typeconsommationlubId: yup
        .string()
        .nullable()
        .label("Type de consommation"),
      obs: yup.string().nullable().label("Observations"),
    });
  }, [locale]);

  const fetchLubrifiants = useCallback(async () => {
    try {
      setIsLoadingLubrifiants(true);
      const response = await apiFetch(API.LUBRIFIANTS.ALL);
      if (response.ok) {
        setLubrifiants(response.data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsLoadingLubrifiants(false);
    }
  }, []);

  const fetchTypeConsommations = useCallback(async () => {
    try {
      setIsLoadingTypes(true);
      // Récupérer les types de consommation associés au parc de l'engin
      const parcId = saisiehim.engin.parcId;
      const response = await apiFetch(API.TYPECONSOMMATIONLUBS.BY_PARC(parcId));
      if (response.ok) {
        setTypeConsommations(response.data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsLoadingTypes(false);
    }
  }, [saisiehim.engin.parcId]);

  const form = useForm({
    defaultValues: {
      lubrifiantId: "",
      qte: "" as unknown as number,
      typeconsommationlubId: "__NONE__",
      obs: "",
    },
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true);
        setError(null);

        await schema.validate(value, { abortEarly: false });

        const response = await apiFetch(API.SAISIELUBRIFIANTS.CREATE, {
          method: methods.POST,
          body: {
            lubrifiantId: value.lubrifiantId,
            qte: parseFloat(value.qte.toString()),
            saisiehimId: saisiehim.id,
            typeconsommationlubId:
              value.typeconsommationlubId &&
              value.typeconsommationlubId !== "__NONE__"
                ? value.typeconsommationlubId
                : null,
            obs: value.obs || null,
          },
        });

        if (response.ok) {
          router.refresh();
          toast.success("Consommation de lubrifiant ajoutée avec succès");
          if (onSuccess) onSuccess();
          onOpenChange(false);
          form.reset();
        } else {
          setError(response.data.message);
          toast.error(
            response.data.message || "Erreur lors de l'ajout de la consommation"
          );
        }
      } catch (err: any) {
        if (err.name === "ValidationError") {
          setError(err.errors.join(", "));
        } else {
          setError(err.message || "Erreur lors de l'ajout");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (open) {
      fetchLubrifiants();
      fetchTypeConsommations();
      form.reset();
      setError(null);
    } else {
      setError(null);
      form.reset();
    }
  }, [open, fetchLubrifiants, fetchTypeConsommations]);

  // Réinitialiser l'erreur lors de la fermeture du dialog
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter une consommation de lubrifiant</DialogTitle>
          <DialogDescription>
            Enregistrer une consommation de lubrifiant pour l'intervention{" "}
            <strong>{saisiehim.panne?.name || "N/A"}</strong> de l'engin{" "}
            <strong>{saisiehim.engin.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <FieldGroup className="gap-4 py-4">
            <FormError error={error} />

            <FormSelectField
              form={form}
              name="lubrifiantId"
              label="Lubrifiant"
              options={lubrifiants.map((l) => ({
                label: `${l.name} (${l.typelubrifiant.name})`,
                value: l.id,
              }))}
              disabled={isSubmitting || isLoadingLubrifiants}
              placeholder="Sélectionner un lubrifiant"
            />

            <FormField
              form={form}
              name="qte"
              label="Quantité"
              type="number"
              step="0.01"
              min="0"
              disabled={isSubmitting}
            />

            <FormSelectField
              form={form}
              name="typeconsommationlubId"
              label="Type de consommation (optionnel)"
              options={[
                { label: "Aucun", value: "__NONE__" },
                ...typeConsommations.map((tc) => ({
                  label: tc.name,
                  value: tc.id,
                })),
              ]}
              disabled={isSubmitting || isLoadingTypes}
              placeholder="Sélectionner un type de consommation"
            />

            <FormField
              form={form}
              name="obs"
              label="Observations"
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
                onOpenChange(false);
              }}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Ajout...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Ajouter
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSaisieLubrifiant;
