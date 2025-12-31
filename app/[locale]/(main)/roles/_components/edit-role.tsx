"use client";
import { API, apiFetch, methods } from "@/lib/api";
import { Role, Permission } from "@/lib/generated/prisma/client";
import { Save, Shield } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type RoleWithPermissions = Role & {
  permissions: Permission[];
};

interface EditRoleProps {
  role: RoleWithPermissions;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const EditRole = ({ role, open, onOpenChange, onSuccess }: EditRoleProps) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);

  const router = useRouter();
  const locale = useCurrentLocale();

  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Schema
  const roleSchema = React.useMemo(() => {
    if (locale === "ar") {
      yup.setLocale(ar);
    } else {
      yup.setLocale(fr);
    }

    return yup.object({
      name: yup.string().min(2).required().label("Nom du rôle"),
      description: yup.string().label("Description"),
      permissions: yup
        .array()
        .of(yup.string().required())
        .min(1, "Sélectionnez au moins une permission")
        .label("Permissions"),
    });
  }, [locale]);

  // Fetch permissions
  const getAllPermissions = useCallback(async () => {
    try {
      setIsLoadingPermissions(true);
      const response = await apiFetch(API.PERMISSIONS.ALL, {
        method: methods.GET,
      });

      if (response.ok && response.data) {
        setPermissions(response.data);
      } else {
        toast.error("Impossible de charger les permissions");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des permissions");
    } finally {
      setIsLoadingPermissions(false);
    }
  }, []);

  const form = useForm({
    defaultValues: {
      name: role.name || "",
      description: role.description || "",
      permissions: role.permissions.map((p) => p.id) || [],
    },
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true);
        setError(null);
        await roleSchema.validate(value, { abortEarly: false });

        // Vérifier si des modifications ont été faites
        const hasChanges =
          value.name !== role?.name ||
          value.description !== role?.description ||
          JSON.stringify(value.permissions.sort()) !==
            JSON.stringify(role.permissions.map((p: any) => p.id).sort());

        if (!hasChanges) {
          onOpenChange(false);
          return;
        }

        const response = await apiFetch(API.ROLES.ROLE_UPDATE(role.id), {
          method: methods.PATCH,
          body: value,
        });

        if (response.ok) {
          router.refresh();
          toast.success(`Rôle mis à jour avec succès`);
          onOpenChange(false);
          onSuccess?.();
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
      form.reset({
        name: role.name,
        description: role.description || "",
        permissions: role.permissions.map((p) => p.id) || [],
      });
      setError(null);
      getAllPermissions();
    } else {
      setError(null);
      form.reset();
    }
  }, [open, role, form, getAllPermissions]);

  const handleOpenChange = (val: boolean) => {
    if (!isSubmitting) onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations du rôle et ses permissions.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4 py-4">
            <FormError error={error} />

            <FormField
              form={form}
              name="name"
              label="Nom du rôle"
              disabled={isSubmitting}
            />

            <FormField
              form={form}
              name="description"
              label="Description"
              disabled={isSubmitting}
            />

            <div className="space-y-3">
              <Label className="text-base">Permissions</Label>
              {isLoadingPermissions ? (
                <div className="flex items-center py-4">
                  <Spinner className="h-4 w-4 mr-2" /> Chargement...
                </div>
              ) : (
                <form.Field
                  name="permissions"
                  children={(field) => {
                    const selected = field.state.value || [];

                    // Group by resource
                    const grouped = permissions.reduce((acc, p) => {
                      if (!acc[p.resource]) acc[p.resource] = [];
                      acc[p.resource].push(p);
                      return acc;
                    }, {} as Record<string, Permission[]>);

                    return (
                      <div className="grid gap-4 max-h-[400px] overflow-y-auto pr-2 border rounded-md p-4">
                        {Object.entries(grouped).map(([resource, perms]) => (
                          <div key={resource} className="space-y-2">
                            <h4 className="text-sm font-semibold capitalize border-b pb-1">
                              {resource}
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {perms.map((p) => (
                                <div
                                  key={p.id}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`edit-perm-${p.id}`}
                                    checked={selected.includes(p.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        field.handleChange([...selected, p.id]);
                                      } else {
                                        field.handleChange(
                                          selected.filter((id) => id !== p.id)
                                        );
                                      }
                                    }}
                                    disabled={isSubmitting}
                                  />
                                  <Label
                                    htmlFor={`edit-perm-${p.id}`}
                                    className="text-xs font-normal cursor-pointer"
                                  >
                                    {p.action}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
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
              disabled={isSubmitting || isLoadingPermissions}
              size="sm"
            >
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

export default EditRole;
