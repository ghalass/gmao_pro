"use client";

import { API, apiFetch, methods } from "@/lib/api";
import { Save } from "lucide-react";
import React, { useEffect } from "react";
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

interface EditLubrifiantProps {
  lubrifiant: any;
  typelubrifiants: any[];
  parcs: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const EditLubrifiant = ({
  lubrifiant,
  typelubrifiants,
  parcs,
  open,
  onOpenChange,
  onSuccess,
}: EditLubrifiantProps) => {
  const router = useRouter();
  const locale = useCurrentLocale();
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const lubrifiantSchema = React.useMemo(() => {
    if (locale === "ar") yup.setLocale(ar);
    else yup.setLocale(fr);
    return yup.object({
      name: yup.string().min(2).required().label("Nom du lubrifiant"),
      typelubrifiantId: yup.string().required().label("Type de lubrifiant"),
      parcIds: yup
        .array()
        .of(yup.string())
        .min(1, "Au moins un parc doit être sélectionné")
        .required("Au moins un parc est requis")
        .label("Parcs"),
    });
  }, [locale]);

  const form = useForm({
    defaultValues: {
      name: lubrifiant?.name || "",
      typelubrifiantId: lubrifiant?.typelubrifiantId || "",
      parcIds:
        lubrifiant?.lubrifiantParc?.map((lp: any) => lp.parc.id) ||
        ([] as string[]),
    },
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true);
        setError(null);

        // Détection de changements
        const hasChanges =
          value.name !== lubrifiant?.name ||
          value.typelubrifiantId !== lubrifiant?.typelubrifiantId ||
          JSON.stringify(value.parcIds?.sort()) !==
            JSON.stringify(
              lubrifiant?.lubrifiantParc?.map((lp: any) => lp.parc.id).sort()
            );

        if (!hasChanges) {
          onOpenChange?.(false);
          return;
        }

        await lubrifiantSchema.validate(value, { abortEarly: false });

        const response = await apiFetch(
          API.LUBRIFIANTS.LUBRIFIANT_UPDATE(lubrifiant.id),
          {
            method: methods.PATCH,
            body: value,
          }
        );

        if (response.ok) {
          router.refresh();
          toast.success(`Lubrifiant mis à jour`);
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
    if (open && lubrifiant) {
      form.reset({
        name: lubrifiant.name,
        typelubrifiantId: lubrifiant.typelubrifiantId,
        parcIds: lubrifiant.lubrifiantParc?.map((lp: any) => lp.parc.id) || [],
      });
      setError(null);
    } else {
      setError(null);
      form.reset();
    }
  }, [open, lubrifiant, form]);

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
            <DialogTitle>Modifier le lubrifiant</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations de ce lubrifiant.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4 py-4">
            <FormError error={error} />

            <FormField
              form={form}
              name="name"
              label="Nom du lubrifiant"
              placeholder="ex: Huile moteur 15W40"
              disabled={isSubmitting}
            />

            <div className="space-y-2">
              <Label>Type de lubrifiant *</Label>
              <form.Field name="typelubrifiantId">
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
                      {typelubrifiants.map((tl) => (
                        <SelectItem key={tl.id} value={tl.id}>
                          {tl.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </form.Field>
            </div>

            <div className="space-y-2">
              <Label>Parcs associés *</Label>
              <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto p-2 border rounded-md">
                <form.Field name="parcIds">
                  {(field) => (
                    <>
                      {parcs.map((parc) => (
                        <div
                          key={parc.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`parc-${parc.id}-${lubrifiant.id}`}
                            checked={field.state.value?.includes(parc.id)}
                            onCheckedChange={(checked) => {
                              const current = field.state.value || [];
                              if (checked) {
                                field.handleChange([...current, parc.id]);
                              } else {
                                field.handleChange(
                                  current.filter((id: string) => id !== parc.id)
                                );
                              }
                            }}
                            disabled={isSubmitting}
                          />
                          <Label
                            htmlFor={`parc-${parc.id}-${lubrifiant.id}`}
                            className="text-sm cursor-pointer truncate"
                          >
                            {parc.name}
                          </Label>
                        </div>
                      ))}
                      {field.state.meta.errors.length > 0 && (
                        <div className="text-sm text-destructive mt-1 col-span-2">
                          {field.state.meta.errors[0]}
                        </div>
                      )}
                    </>
                  )}
                </form.Field>
              </div>
              {form.state.values.parcIds &&
                form.state.values.parcIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {form.state.values.parcIds.length} parc(s) sélectionné(s)
                  </p>
                )}
            </div>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              size="sm"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting} size="sm">
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

export default EditLubrifiant;
