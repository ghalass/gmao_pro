"use client";
import { API, apiFetch, methods } from "@/lib/api";
import { Permission } from "@/lib/generated/prisma/client";
import { Save } from "lucide-react";
import React, { useEffect, useState, useCallback } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const actions = ["create", "read", "update", "delete"];

interface EditPermissionProps {
  permission: Permission;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditPermission = ({
  permission,
  open,
  onOpenChange,
}: EditPermissionProps) => {
  const router = useRouter();
  const locale = useCurrentLocale();

  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [resources, setResources] = useState<string[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);

  // Fetch resources (table names)
  const fetchResources = useCallback(async () => {
    try {
      setIsLoadingResources(true);
      const response = await apiFetch(API.PERMISSIONS.RESOURCES, {
        method: methods.GET,
      });

      if (response.ok && response.data) {
        setResources(response.data);
      } else {
        toast.error("Impossible de charger les ressources");
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsLoadingResources(false);
    }
  }, []);

  // Schema
  const permissionSchema = React.useMemo(() => {
    if (locale === "ar") {
      yup.setLocale(ar);
    } else {
      yup.setLocale(fr);
    }

    return yup.object({
      resource: yup.string().min(2).required().label("Ressource"),
      action: yup.string().oneOf(actions).required().label("Action"),
      description: yup.string().label("Description"),
    });
  }, [locale]);

  const form = useForm({
    defaultValues: {
      resource: permission.resource || "",
      action: permission.action || "read",
      description: permission.description || "",
    },
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true);
        setError(null);
        await permissionSchema.validate(value, { abortEarly: false });

        const response = await apiFetch(
          API.PERMISSIONS.PERMISSION_UPDATE(permission.id),
          {
            method: methods.PATCH,
            body: value,
          }
        );

        if (response.ok) {
          router.refresh();
          toast.success(`Permission mise à jour avec succès`);
          onOpenChange(false);
        } else {
          const errorData = response.data?.message;
          setError(errorData || "Erreur lors de la mise à jour");
        }
      } catch (err: any) {
        if (err.name === "ValidationError") {
          setError(err.errors.join(", "));
        } else {
          setError(err.message || "Erreur lors de la mise à jour");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (open) {
      form.reset();
      form.setFieldValue("resource", permission.resource);
      form.setFieldValue("action", permission.action);
      form.setFieldValue("description", permission.description || "");
      setError(null);
      fetchResources();
    }
  }, [open, permission, form, fetchResources]);

  const handleOpenChange = (val: boolean) => {
    if (!isSubmitting) onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Modifier la permission</DialogTitle>
            <DialogDescription>
              Mettez à jour les détails de la permission d'accès.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4 py-4">
            <FormError error={error} />

            <div className="space-y-2">
              <Label>Ressource (Table)</Label>
              <form.Field
                name="resource"
                children={(field) => (
                  <Select
                    disabled={isSubmitting || isLoadingResources}
                    value={field.state.value}
                    onValueChange={(val) => field.handleChange(val as any)}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          isLoadingResources
                            ? "Chargement..."
                            : "Choisir une table"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {resources.map((res) => (
                        <SelectItem
                          key={res}
                          value={res}
                          className="capitalize"
                        >
                          {res}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.state.fieldMeta.resource?.errors &&
                form.state.fieldMeta.resource.errors.length > 0 && (
                  <p className="text-xs text-destructive">
                    {form.state.fieldMeta.resource.errors[0]?.message ||
                      form.state.fieldMeta.resource.errors[0]}
                  </p>
                )}
            </div>

            <div className="space-y-2">
              <Label>Action</Label>
              <form.Field
                name="action"
                children={(field) => (
                  <Select
                    disabled={isSubmitting}
                    value={field.state.value}
                    onValueChange={(val) => field.handleChange(val as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une action" />
                    </SelectTrigger>
                    <SelectContent>
                      {actions.map((act) => (
                        <SelectItem
                          key={act}
                          value={act}
                          className="capitalize"
                        >
                          {act}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <FormField
              form={form}
              name="description"
              label="Description (optionnelle)"
              disabled={isSubmitting}
            />
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
                <Spinner className="h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPermission;
