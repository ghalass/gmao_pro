"use client";
import { API, apiFetch, methods } from "@/lib/api";
import { Save } from "lucide-react";
import React, { useEffect } from "react";
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
} from "@/components/ui/dialog";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import FormError from "@/components/form/FormError";
import { Organe, TypeOrgane } from "@/lib/generated/prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import HierarchicalSelector from "./hierarchical-selector";

interface EditOrganeProps {
  organe: Organe & { type_organe: TypeOrgane };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditOrgane = ({ organe, open, onOpenChange }: EditOrganeProps) => {
  const router = useRouter();

  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
          // Afficher les erreurs détaillées de l'API
          const errorData = response.data;
          let errorMessage = "Erreur lors de la modification";

          if (errorData) {
            if (typeof errorData === "string") {
              errorMessage = errorData;
            } else if (errorData.error) {
              errorMessage = errorData.error;
            } else if (errorData.message) {
              errorMessage = errorData.message;
            } else if (Array.isArray(errorData.details)) {
              errorMessage = errorData.details.join(", ");
            }

            // Ajouter le statut HTTP pour plus de contexte
            errorMessage = `Erreur ${response.status}: ${errorMessage}`;
          }

          console.error("Erreur API modification organe:", errorData);
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Erreur lors de la modification";
        setError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Réinitialiser l'erreur lors de la fermeture du dialog
  useEffect(() => {
    if (!open) {
      setError(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-lg">Modifier l&apos;organe</DialogTitle>
          <DialogDescription className="text-sm">
            Modifier les informations de l&apos;organe
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
                key={organe.id} // Force la réinitialisation quand l'organe change
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
