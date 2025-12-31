"use client";
import { API, apiFetch, methods } from "@/lib/api";
import { User, Role } from "@/lib/generated/prisma/client";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import DisplayData from "@/components/DisplayData";

type UserWithRoles = User & {
  roles: Role[];
};

const EditUser = ({
  user,
  open,
  onOpenChange,
}: {
  user: UserWithRoles;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  // Use external control if provided, otherwise internal
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const modalOpen = isControlled ? open : internalOpen;
  const setModalOpen = isControlled ? onOpenChange : setInternalOpen;

  const router = useRouter();
  const locale = useCurrentLocale();

  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Créer le schéma avec traductions
  const editUserSchema = React.useMemo(() => {
    if (locale === "ar") {
      yup.setLocale(ar);
    } else {
      yup.setLocale(fr);
    }

    return yup.object({
      name: yup.string().min(3).required().label("Nom d'utilisateur"),
      email: yup.string().email().required().label("email"),
      roles: yup.array().of(yup.string().required()).min(1).label("rôles"),
      changePassword: yup.boolean().default(false),
      password: yup.string().when("changePassword", {
        is: true,
        then: (schema) => schema.min(6).required().label("Mot de passe"),
        otherwise: (schema) => schema.optional(),
      }),
      passwordConfirmation: yup.string().when("changePassword", {
        is: true,
        then: (schema) =>
          schema
            .oneOf(
              [yup.ref("password")],
              "Les mots de passe doivent correspondre"
            )
            .required()
            .label("Confirmation du mot de passe"),
        otherwise: (schema) => schema.optional(),
      }),
    });
  }, [locale]);

  // Fonction pour récupérer les rôles
  const getAllRoles = useCallback(async () => {
    try {
      setIsLoadingRoles(true);
      const response = await apiFetch(API.ROLES.ALL, {
        method: methods.GET,
      });

      if (response.ok && response.data) {
        setRoles(response.data);
      } else {
        console.error(
          "Erreur lors de la récupération des rôles:",
          response.data?.message
        );
        toast.error("Impossible de charger les rôles");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des rôles");
    } finally {
      setIsLoadingRoles(false);
    }
  }, []);

  // Fonction de validation pour chaque champ
  const validateField = useCallback(
    (fieldName: string, value: any, context?: any) => {
      try {
        editUserSchema.validateSyncAt(fieldName, {
          [fieldName]: value,
          ...context,
        });
        return undefined;
      } catch (err: any) {
        return err.message;
      }
    },
    [editUserSchema]
  );

  // Fonction de modification utilisateur
  const editUserResponse = useCallback(
    async (
      userId: string,
      name: string,
      active: boolean,
      roles: string[],
      password?: string
    ) => {
      const body: any = { name, active, roles };
      if (password) {
        body.password = password;
      }
      return apiFetch(API.USERS.USER_UPDATE(userId), {
        method: methods.PATCH,
        body,
      });
    },
    []
  );

  const form = useForm({
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      active: user?.active || false,
      roles: user?.roles?.map((role) => role.id) || [],
      changePassword: false,
      password: "",
      passwordConfirmation: "",
    },
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true);
        setError(null);
        await editUserSchema.validate(value, { abortEarly: false });

        // Utiliser la fonction de modification
        const response = await editUserResponse(
          user.id,
          value.name,
          value.active,
          value.roles,
          value.changePassword ? value.password : undefined
        );

        if (response.ok) {
          router.refresh();
          toast.success(`Utilisateur modifié avec succès`);
          setModalOpen(false);
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

  // Helper pour la validation avec contexte
  const getFieldValidator = useCallback(
    (fieldName: string) => {
      return (value: any) => {
        const formValues = form.state.values;
        // On passe tout l'état du formulaire comme contexte pour que 'when' fonctionne
        return validateField(fieldName, value, formValues);
      };
    },
    [form, validateField]
  );

  // Réinitialiser le form quand le modal s'ouvre
  useEffect(() => {
    if (modalOpen) {
      form.reset({
        name: user?.name || "",
        email: user?.email || "",
        active: user?.active || false,
        roles: user?.roles?.map((role) => role.id) || [],
        changePassword: false,
        password: "",
        passwordConfirmation: "",
      });
      setError(null);
    } else {
      setError(null);
      form.reset();
    }
  }, [modalOpen, user]);

  // Charger les rôles quand le modal s'ouvre
  useEffect(() => {
    if (modalOpen) {
      getAllRoles();
    }
  }, [modalOpen, getAllRoles]);

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
        id={`edit-user-form-${user.id}`}
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'utilisateur et ses rôles.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-1">
            <FormError error={error} />

            <FormField
              form={form}
              name="name"
              label="Nom"
              customValidator={getFieldValidator("name")}
              disabled={isSubmitting}
            />

            <FormCheckbox
              form={form}
              name="active"
              label="Utilisateur actif"
              disabled={isSubmitting}
            />

            <FormField
              form={form}
              name="email"
              label="Email"
              customValidator={getFieldValidator("email")}
              disabled
            />

            <div className="py-2">
              <FormCheckbox
                form={form}
                name="changePassword"
                label="Modifier le mot de passe"
                disabled={isSubmitting}
              />

              <form.Subscribe
                selector={(state) => state.values.changePassword}
                children={(changePassword) =>
                  changePassword ? (
                    <div className="mt-2 space-y-2 pl-4 border-l-2 border-muted animate-in fade-in slide-in-from-top-1">
                      <FormField
                        form={form}
                        name="password"
                        label="Nouveau mot de passe"
                        type="password"
                        customValidator={getFieldValidator("password")}
                        disabled={isSubmitting}
                      />
                      <FormField
                        form={form}
                        name="passwordConfirmation"
                        label="Confirmer le mot de passe"
                        type="password"
                        customValidator={getFieldValidator(
                          "passwordConfirmation"
                        )}
                        disabled={isSubmitting}
                      />
                    </div>
                  ) : null
                }
              />
            </div>

            {/* Section des rôles */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Rôles attribués</div>

              {isLoadingRoles ? (
                <div className="flex items-center justify-center py-4">
                  <Spinner className="h-5 w-5" />
                  <span className="ml-2">Chargement des rôles...</span>
                </div>
              ) : roles.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Aucun rôle disponible
                </div>
              ) : (
                <form.Field
                  name="roles"
                  children={(field) => {
                    const selectedRoles = field.state.value || [];

                    // Fonction pour gérer la sélection/désélection d'un rôle
                    const handleRoleToggle = (
                      roleId: string,
                      checked: boolean
                    ) => {
                      if (checked) {
                        // Ajouter le rôle
                        field.handleChange([...selectedRoles, roleId]);
                      } else {
                        // Retirer le rôle
                        field.handleChange(
                          selectedRoles.filter((id) => id !== roleId)
                        );
                      }
                    };

                    return (
                      <>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                          {roles
                            .filter((role) => !!role.id)
                            .map((role) => (
                              <div
                                key={role.id}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={`role-${role.id}-${user.id}`}
                                  checked={selectedRoles.includes(role.id)}
                                  onCheckedChange={(checked) =>
                                    handleRoleToggle(role.id, checked === true)
                                  }
                                  disabled={isSubmitting}
                                />
                                <Label
                                  htmlFor={`role-${role.id}-${user.id}`}
                                  className="text-sm font-normal cursor-pointer flex-1"
                                >
                                  <div className="font-medium">{role.name}</div>
                                  {role.description && (
                                    <div className="text-xs text-muted-foreground">
                                      {role.description}
                                    </div>
                                  )}
                                </Label>
                              </div>
                            ))}
                        </div>

                        {selectedRoles.length > 0 && (
                          <div className="text-sm text-muted-foreground mt-2">
                            {selectedRoles.length} rôle(s) sélectionné(s)
                          </div>
                        )}

                        {field.state.meta.errors.length > 0 && (
                          <div className="text-sm text-destructive mt-1">
                            {field.state.meta.errors[0]}
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
                form={`edit-user-form-${user.id}`}
                disabled={isSubmitting || isLoadingRoles}
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

export default EditUser;
