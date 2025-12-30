"use client";
import { API, apiFetch, methods } from "@/lib/api";
import { Role } from "@/lib/generated/prisma/client";
import { Plus, Save } from "lucide-react";
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
  DialogTrigger,
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

const NewUser = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  const router = useRouter();
  const locale = useCurrentLocale();

  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Créer le schéma avec traductions
  const newUserSchema = React.useMemo(() => {
    if (locale === "ar") {
      yup.setLocale(ar);
    } else {
      yup.setLocale(fr);
    }

    return yup.object({
      name: yup.string().min(3).required().label("Nom d'utilisateur"),
      email: yup.string().email().required().label("Email"),
      password: yup.string().min(6).required().label("Mot de passe"),
      passwordConfirmation: yup
        .string()
        .oneOf([yup.ref("password")], "Les mots de passe doivent correspondre")
        .required("La confirmation du mot de passe est requise")
        .label("Confirmation du mot de passe"),
      active: yup.boolean().default(true).label("Statut"),
      roles: yup
        .array()
        .of(yup.string().required())
        .min(1, "Sélectionnez au moins un rôle")
        .label("Rôles"),
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

  // Fonction de validation personnalisée pour passwordConfirmation
  const validatePasswordConfirmation = useCallback(
    (value: string, context: { password?: string }) => {
      if (!value) {
        return "La confirmation du mot de passe est requise";
      }
      if (context.password && value !== context.password) {
        return "Les mots de passe doivent correspondre";
      }
      return undefined;
    },
    []
  );

  // Fonction de validation pour chaque champ
  const validateField = useCallback(
    (fieldName: string, value: any, context?: any) => {
      try {
        // Pour passwordConfirmation, on a besoin du contexte avec le password
        if (fieldName === "passwordConfirmation") {
          return validatePasswordConfirmation(value, context || {});
        }

        newUserSchema.validateSyncAt(fieldName, {
          [fieldName]: value,
          ...context,
        });
        return undefined;
      } catch (err: any) {
        return err.message;
      }
    },
    [newUserSchema, validatePasswordConfirmation]
  );

  // Fonction de création d'utilisateur
  const createUserResponse = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      active: boolean,
      roles: string[]
    ) => {
      return apiFetch(API.USERS.USER_CREATE, {
        method: methods.POST,
        body: { name, email, password, active, roles },
      });
    },
    []
  );

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      passwordConfirmation: "",
      active: true,
      roles: [] as string[],
    },
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true);
        setError(null);

        // Valider manuellement passwordConfirmation avec le contexte
        const passwordConfirmationError = validatePasswordConfirmation(
          value.passwordConfirmation,
          { password: value.password }
        );

        if (passwordConfirmationError) {
          throw new yup.ValidationError(
            passwordConfirmationError,
            value.passwordConfirmation,
            "passwordConfirmation"
          );
        }

        // Valider le reste avec le schéma
        await newUserSchema.validate(value, { abortEarly: false });

        // Utiliser la fonction de création
        const response = await createUserResponse(
          value.name,
          value.email,
          value.password,
          value.active,
          value.roles
        );

        if (response.ok) {
          router.refresh();
          toast.success(`Utilisateur créé avec succès`);
          setModalOpen(false);
          form.reset();
        } else {
          const errorData = response.data?.message;
          setError(errorData);
          toast.error(errorData || "Erreur lors de la création");
          console.error(errorData);
        }
      } catch (err: any) {
        console.error("Erreur de création:", err);
        if (err.name === "ValidationError" && err.errors) {
          setError(err.errors.join(", "));
          toast.error(err.errors.join(", "));
        } else if (err.response?.data?.message) {
          setError(err.response.data.message);
          toast.error(err.response.data.message);
        } else {
          setError(err.message || "Erreur lors de la création");
          toast.error(err.message || "Erreur lors de la création");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Fonction de validation pour FormField avec contexte
  const getFieldValidator = useCallback(
    (fieldName: string) => {
      return (value: any) => {
        if (fieldName === "passwordConfirmation") {
          // Pour passwordConfirmation, on a besoin du mot de passe actuel
          const password = form.getFieldValue("password");
          return validateField(fieldName, value, { password });
        }
        return validateField(fieldName, value);
      };
    },
    [form, validateField]
  );

  // Réinitialiser le form quand le modal s'ouvre
  useEffect(() => {
    if (modalOpen) {
      form.reset();
      // Réinitialiser l'erreur
      setError(null);
    } else {
      setError(null);
      form.reset();
    }
  }, [modalOpen, form]);

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
        id="new-user-form"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <DialogTrigger asChild>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nouvel utilisateur
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
            <DialogDescription>
              Ajoutez un nouvel utilisateur au système.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-1">
            <FormError error={error} />

            <FormField
              form={form}
              name="name"
              label="Nom d'utilisateur"
              customValidator={getFieldValidator("name")}
              disabled={isSubmitting}
            />

            <FormField
              form={form}
              name="email"
              label="Email"
              type="email"
              customValidator={getFieldValidator("email")}
              disabled={isSubmitting}
            />

            <FormField
              form={form}
              name="password"
              label="Mot de passe"
              type="password"
              customValidator={getFieldValidator("password")}
              disabled={isSubmitting}
            />

            <FormField
              form={form}
              name="passwordConfirmation"
              label="Confirmer le mot de passe"
              type="password"
              customValidator={getFieldValidator("passwordConfirmation")}
              disabled={isSubmitting}
            />

            <FormCheckbox
              form={form}
              name="active"
              label="Activer l'utilisateur immédiatement"
              disabled={isSubmitting}
            />

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
                                  id={`role-${role.id}-new`}
                                  checked={selectedRoles.includes(role.id)}
                                  onCheckedChange={(checked) =>
                                    handleRoleToggle(role.id, checked === true)
                                  }
                                  disabled={isSubmitting}
                                />
                                <Label
                                  htmlFor={`role-${role.id}-new`}
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
                onClick={() => setModalOpen(false)}
                disabled={isSubmitting}
                size="sm"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                form="new-user-form"
                disabled={isSubmitting || isLoadingRoles}
                className="flex-1"
                size="sm"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner className="h-4 w-4" />
                    Création...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Save className="h-4 w-4" />
                    Créer l'utilisateur
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

export default NewUser;
