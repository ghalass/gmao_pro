"use client";

import { useState, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import * as yup from "yup";
import { API, apiFetch, methods } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FormError from "@/components/form/FormError";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

interface EditSaisieLubrifiantProps {
  saisieLubrifiant: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const validationSchema = yup.object().shape({
  qte: yup
    .number()
    .required("La quantité est requise")
    .positive("La quantité doit être positive")
    .typeError("La quantité doit être un nombre"),
});

const EditSaisieLubrifiant = ({
  saisieLubrifiant,
  open,
  onOpenChange,
  onSuccess,
}: EditSaisieLubrifiantProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lubrifiants, setLubrifiants] = useState<any[]>([]);
  const [typeConsommations, setTypeConsommations] = useState<any[]>([]);

  const form = useForm({
    defaultValues: {
      qte: saisieLubrifiant?.qte || 0,
      lubrifiantId: saisieLubrifiant?.lubrifiantId || "",
      typeconsommationlubId: saisieLubrifiant?.typeconsommationlubId || "",
    },
    onSubmit: async ({ value }) => {
      try {
        setLoading(true);
        setError(null);

        // Convertir les chaînes vides en null pour l'API
        const cleanedValue = {
          ...value,
          lubrifiantId:
            value.lubrifiantId === "" ? undefined : value.lubrifiantId,
          typeconsommationlubId:
            value.typeconsommationlubId === ""
              ? null
              : value.typeconsommationlubId,
        };

        const response = await apiFetch(
          API.SAISIELUBRIFIANTS.UPDATE(saisieLubrifiant.id),
          {
            method: methods.PATCH,
            body: cleanedValue,
          }
        );

        if (response.ok) {
          toast.success("Consommation de lubrifiant modifiée avec succès");
          onSuccess();
          onOpenChange(false);
        } else {
          setError(response.data?.message || "Erreur lors de la modification");
        }
      } catch (err: any) {
        setError(err.message || "Erreur lors de la modification");
      } finally {
        setLoading(false);
      }
    },
  });

  const fetchLubrifiants = async () => {
    try {
      const response = await apiFetch(API.LUBRIFIANTS.ALL);
      if (response.ok) {
        setLubrifiants(response.data);
      }
    } catch (error) {
      console.error("Error fetching lubrifiants:", error);
    }
  };

  const fetchTypeConsommations = async () => {
    try {
      const response = await apiFetch(API.TYPECONSOMMATIONLUBS.ALL);
      if (response.ok) {
        setTypeConsommations(response.data);
      }
    } catch (error) {
      console.error("Error fetching type consommations:", error);
    }
  };

  useEffect(() => {
    if (open && saisieLubrifiant) {
      form.setFieldValue("qte", saisieLubrifiant?.qte || 0);
      form.setFieldValue("lubrifiantId", saisieLubrifiant?.lubrifiantId || "");
      form.setFieldValue(
        "typeconsommationlubId",
        saisieLubrifiant?.typeconsommationlubId || ""
      );
    }
  }, [open, saisieLubrifiant]);

  useEffect(() => {
    if (open) {
      fetchLubrifiants();
      fetchTypeConsommations();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier la consommation de lubrifiant</DialogTitle>
          <DialogDescription>
            Modifiez les informations de la consommation de lubrifiant.
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
          <div className="space-y-2">
            <Label htmlFor="lubrifiantId">Lubrifiant *</Label>
            <form.Field name="lubrifiantId">
              {(field) => (
                <Select
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un lubrifiant" />
                  </SelectTrigger>
                  <SelectContent>
                    {lubrifiants.map((lub) => (
                      <SelectItem key={lub.id} value={lub.id}>
                        {lub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </form.Field>
            {form.state.fieldMeta.lubrifiantId?.errors &&
              form.state.fieldMeta.lubrifiantId.errors.length > 0 && (
                <p className="text-xs text-destructive">
                  {form.state.fieldMeta.lubrifiantId.errors[0]?.message ||
                    form.state.fieldMeta.lubrifiantId.errors[0]}
                </p>
              )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="typeconsommationlubId">Type de consommation</Label>
            <form.Field name="typeconsommationlubId">
              {(field) => (
                <Select
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeConsommations.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </form.Field>
            {form.state.fieldMeta.typeconsommationlubId?.errors &&
              form.state.fieldMeta.typeconsommationlubId.errors.length > 0 && (
                <p className="text-xs text-destructive">
                  {form.state.fieldMeta.typeconsommationlubId.errors[0]
                    ?.message ||
                    form.state.fieldMeta.typeconsommationlubId.errors[0]}
                </p>
              )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="qte">Quantité (L) *</Label>
            <form.Field
              name="qte"
              validators={{
                onChange: ({ value }) => {
                  if (typeof value !== "number" || value <= 0) {
                    return "La quantité doit être un nombre positif";
                  }
                  return undefined;
                },
              }}
            >
              {(field) => (
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Quantité en litres"
                  value={field.state.value}
                  onChange={(e) =>
                    field.handleChange(parseFloat(e.target.value) || 0)
                  }
                  disabled={loading}
                />
              )}
            </form.Field>
            {form.state.fieldMeta.qte?.errors &&
              form.state.fieldMeta.qte.errors.length > 0 && (
                <p className="text-xs text-destructive">
                  {form.state.fieldMeta.qte.errors[0]?.message ||
                    form.state.fieldMeta.qte.errors[0]}
                </p>
              )}
          </div>

          {error && <FormError error={error} />}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <form.Subscribe selector={(state) => state.canSubmit}>
              {(canSubmit) => (
                <Button type="submit" disabled={!canSubmit || loading}>
                  {loading ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Modification...
                    </>
                  ) : (
                    "Modifier"
                  )}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditSaisieLubrifiant;
