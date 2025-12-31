"use client";

import { API, apiFetch, methods } from "@/lib/api";
import { Saisiehrm, Panne, Engin } from "@/lib/generated/prisma/client";
import { Plus, Save } from "lucide-react";
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

interface AddSaisiehimProps {
  saisiehrm: Saisiehrm & { engin: Engin };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AddSaisiehim = ({
  saisiehrm,
  open,
  onOpenChange,
  onSuccess,
}: AddSaisiehimProps) => {
  const [pannes, setPannes] = useState<Panne[]>([]);
  const [isLoadingPannes, setIsLoadingPannes] = useState(false);

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
      panneId: yup.string().required().label("Panne"),
      him: yup.number().positive().required().label("HIM"),
      ni: yup
        .number()
        .integer()
        .min(0)
        .required()
        .label("Nombre d'interventions"),
      obs: yup.string().nullable().label("Observations"),
    });
  }, [locale]);

  const fetchPannes = useCallback(async () => {
    try {
      setIsLoadingPannes(true);
      const response = await apiFetch(API.PANNES.ALL);
      if (response.ok) {
        setPannes(response.data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsLoadingPannes(false);
    }
  }, []);

  const form = useForm({
    defaultValues: {
      panneId: "",
      him: "" as unknown as number,
      ni: 1,
      obs: "",
    },
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true);
        setError(null);

        await schema.validate(value, { abortEarly: false });

        const response = await apiFetch(API.SAISIEHIMS.CREATE, {
          method: methods.POST,
          body: {
            ...value,
            saisiehrmId: saisiehrm.id,
            enginId: saisiehrm.enginId,
            him: parseFloat(value.him.toString()),
            ni: parseInt(value.ni.toString()),
          },
        });

        if (response.ok) {
          router.refresh();
          toast.success("Saisie HIM ajoutée avec succès");
          if (onSuccess) onSuccess();
          onOpenChange(false);
          form.reset();
        } else {
          setError(response.data.message);
          toast.error(response.data.message || "Erreur lors de l'ajout");
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
      fetchPannes();
      form.reset();
      setError(null);
    } else {
      setError(null);
      form.reset();
    }
  }, [open, fetchPannes]);

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
          <DialogTitle>Ajouter une saisie HIM</DialogTitle>
          <DialogDescription>
            Enregistrer une intervention pour l'engin{" "}
            <strong>{saisiehrm.engin.name}</strong> le{" "}
            <strong>{new Date(saisiehrm.du).toLocaleDateString()}</strong>.
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
              name="panneId"
              label="Panne"
              options={pannes.map((p) => ({ label: p.name, value: p.id }))}
              disabled={isSubmitting || isLoadingPannes}
              placeholder="Sélectionner une panne"
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                form={form}
                name="him"
                label="HIM (heures)"
                type="number"
                disabled={isSubmitting}
              />
              <FormField
                form={form}
                name="ni"
                label="Nombre d'interventions"
                type="number"
                disabled={isSubmitting}
              />
            </div>

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
                  Ajouter HIM
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSaisiehim;
