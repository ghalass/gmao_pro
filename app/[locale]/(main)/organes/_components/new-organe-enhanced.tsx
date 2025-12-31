"use client";
import { API, apiFetch, methods } from "@/lib/api";
import { TypeOrgane, Parc, Typeparc } from "@/lib/generated/prisma/client";
import { Plus, Save, Filter, ChevronDown } from "lucide-react";
import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "@tanstack/react-form";
import * as yup from "yup";
import { fr, ar } from "yup-locales";
import { FieldGroup } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import FormError from "@/components/form/FormError";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const NewOrgane = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [typeParcs, setTypeParcs] = useState<Typeparc[]>([]);
  const [parcs, setParcs] = useState<Parc[]>([]);
  const [typeOrganes, setTypeOrganes] = useState<TypeOrgane[]>([]);
  const [isLoadingTypeParcs, setIsLoadingTypeParcs] = useState(false);
  const [isLoadingParcs, setIsLoadingParcs] = useState(false);
  const [isLoadingTypeOrganes, setIsLoadingTypeOrganes] = useState(false);

  const router = useRouter();
  const locale = useCurrentLocale();

  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // États pour les filtres
  const [selectedTypeParc, setSelectedTypeParc] = useState<string>("");
  const [selectedParc, setSelectedParc] = useState<string>("");
  const [filteredTypeOrganes, setFilteredTypeOrganes] = useState<TypeOrgane[]>(
    []
  );

  // Créer le schéma avec traductions
  const newOrganeSchema = React.useMemo(() => {
    if (locale === "ar") {
      yup.setLocale(ar);
    } else {
      yup.setLocale(fr);
    }

    return yup.object({
      name: yup.string().required("Le nom est requis"),
      typeOrganeId: yup.string().required("Le type d'organe est requis"),
      marque: yup.string().optional(),
      sn: yup.string().optional(),
      date_mes: yup.string().optional(),
      origine: yup.string().oneOf(["BRC", "APPRO", "AUTRE"]).optional(),
      circuit: yup.string().optional(),
      hrm_initial: yup.number().optional().min(0),
      obs: yup.string().optional(),
      active: yup.boolean().default(true),
    });
  }, [locale]);

  const form = useForm({
    defaultValues: {
      name: "",
      typeOrganeId: "",
      marque: "",
      sn: "",
      date_mes: "",
      origine: "",
      circuit: "",
      hrm_initial: 0,
      obs: "",
      active: true,
    },
    onSubmit: async ({ value }) => {
      // Validation manuelle avant envoi
      if (!value.name.trim()) {
        setError("Le nom est requis");
        return;
      }
      if (!value.typeOrganeId) {
        setError("Le type d'organe est requis");
        return;
      }

      try {
        setIsSubmitting(true);
        setError(null);

        const response = await apiFetch(API.ORGANES.ORGANE_CREATE, {
          method: methods.POST,
          body: value,
        });

        if (response.ok) {
          toast.success("Organe créé avec succès");
          setModalOpen(false);
          form.reset();
          router.refresh();
        } else {
          setError(response.data?.message || "Erreur lors de la création");
        }
      } catch (err: any) {
        setError(err.message || "Erreur lors de la création");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Charger les types de parcs
  const loadTypeParcs = useCallback(async () => {
    try {
      setIsLoadingTypeParcs(true);
      const response = await apiFetch(API.TYPEPARCS.ALL);
      if (response.ok) {
        setTypeParcs(response.data || []);
      } else {
        console.error("Erreur API typeparcs:", response.data);
        setTypeParcs([]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des types de parcs:", error);
      setTypeParcs([]);
    } finally {
      setIsLoadingTypeParcs(false);
    }
  }, []);

  // Charger les parcs selon le type de parc sélectionné
  const loadParcs = useCallback(async (typeParcId: string) => {
    if (!typeParcId) {
      setParcs([]);
      setSelectedParc("");
      return;
    }

    try {
      setIsLoadingParcs(true);
      const response = await apiFetch(API.PARCS.ALL);
      if (response.ok) {
        const allParcs = response.data || [];
        const filteredParcs = allParcs.filter(
          (parc: Parc) => parc.typeparcId === typeParcId
        );
        setParcs(filteredParcs);
      } else {
        console.error("Erreur API parcs:", response.data);
        setParcs([]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des parcs:", error);
      setParcs([]);
    } finally {
      setIsLoadingParcs(false);
    }
  }, []);

  // Charger les types d'organes selon le parc sélectionné
  const loadTypeOrganes = useCallback(async (parcId: string) => {
    if (!parcId) {
      setTypeOrganes([]);
      setFilteredTypeOrganes([]);
      return;
    }

    try {
      setIsLoadingTypeOrganes(true);
      // Récupérer le parc avec ses typeOrganes associés
      const parcResponse = await apiFetch(API.PARCS.PARC_DETAILS(parcId));

      console.log("🔍 Réponse API PARCS.PARC_DETAILS:", parcResponse);

      if (parcResponse.ok && parcResponse.data) {
        const parc = parcResponse.data;
        console.log("🔍 Données du parc:", parc);

        // Utiliser uniquement les typeOrganes associés au parc (même si vide)
        const associatedTypeOrganes = parc.typeOrganes || [];
        console.log(
          `📋 Parc "${parc.name}" : ${associatedTypeOrganes.length} type(s) d'organe associé(s)`
        );
        console.log("🔍 Types d'organes associés:", associatedTypeOrganes);

        setTypeOrganes(associatedTypeOrganes);
        setFilteredTypeOrganes(associatedTypeOrganes);
      } else {
        console.error(
          "❌ Erreur lors de la récupération du parc:",
          parcResponse.data
        );
        setTypeOrganes([]);
        setFilteredTypeOrganes([]);
      }
    } catch (error) {
      console.error("❌ Erreur lors du chargement des types d'organes:", error);
      setTypeOrganes([]);
      setFilteredTypeOrganes([]);
    } finally {
      setIsLoadingTypeOrganes(false);
    }
  }, []);

  // Effets pour charger les données
  useEffect(() => {
    if (modalOpen) {
      loadTypeParcs();
    }
  }, [modalOpen, loadTypeParcs]);

  useEffect(() => {
    if (selectedTypeParc) {
      loadParcs(selectedTypeParc);
      // Réinitialiser le parc et le type d'organe quand le type de parc change
      setSelectedParc("");
      form.setFieldValue("typeOrganeId", "");
    }
  }, [selectedTypeParc, loadParcs]);

  useEffect(() => {
    if (selectedParc) {
      loadTypeOrganes(selectedParc);
    }
  }, [selectedParc, loadTypeOrganes]);

  // Réinitialiser le formulaire et l'erreur lors de la fermeture du dialog
  useEffect(() => {
    if (!modalOpen) {
      form.reset();
      setError(null);
      setSelectedTypeParc("");
      setSelectedParc("");
      setTypeOrganes([]);
      setFilteredTypeOrganes([]);
    }
  }, [modalOpen, form]);

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel organe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-150 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter un organe</DialogTitle>
          <DialogDescription>
            Créer un nouvel organe dans le système
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <FieldGroup className="space-y-4">
            {/* Section Filtres */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Sélection du type d'organe
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Filtre TypeParc */}
                <div className="space-y-2">
                  <FieldLabel htmlFor="typeParc">Type de parc</FieldLabel>
                  <Select
                    value={selectedTypeParc}
                    onValueChange={(value) => {
                      setSelectedTypeParc(value);
                      setSelectedParc("");
                    }}
                    disabled={isLoadingTypeParcs}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {typeParcs.map((typeParc) => (
                        <SelectItem key={typeParc.id} value={typeParc.id}>
                          {typeParc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtre Parc */}
                <div className="space-y-2">
                  <FieldLabel htmlFor="parc">Parc</FieldLabel>
                  <Select
                    value={selectedParc}
                    onValueChange={(value) => {
                      setSelectedParc(value);
                      form.setFieldValue("typeOrganeId", "");
                    }}
                    disabled={!selectedTypeParc || isLoadingParcs}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner d'abord un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {parcs.map((parc) => (
                        <SelectItem key={parc.id} value={parc.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{parc.name}</span>
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {typeParcs.find((tp) => tp.id === parc.typeparcId)
                                ?.name || "N/A"}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* TypeOrgane sélectionné */}
                <div className="space-y-2">
                  <FieldLabel>Type d'organe</FieldLabel>
                  <div className="relative">
                    <Input
                      value={
                        filteredTypeOrganes.find(
                          (to) => to.id === form.getFieldValue("typeOrganeId")
                        )?.name || ""
                      }
                      placeholder="Sélectionner un parc d'abord"
                      disabled
                      className="bg-muted"
                    />
                    <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 pointer-events-none text-muted-foreground" />
                  </div>
                </div>
              </div>

              {/* Types d'organes disponibles */}
              {filteredTypeOrganes.length > 0 ? (
                <div className="mt-3 p-3 bg-background rounded border">
                  <h4 className="text-sm font-medium mb-2">
                    Types d'organes disponibles:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {filteredTypeOrganes.map((typeOrgane) => (
                      <Badge
                        key={typeOrgane.id}
                        variant={
                          form.getFieldValue("typeOrganeId") === typeOrgane.id
                            ? "default"
                            : "secondary"
                        }
                        className="cursor-pointer hover:bg-primary/80 transition-colors"
                        onClick={() =>
                          form.setFieldValue("typeOrganeId", typeOrgane.id)
                        }
                      >
                        {typeOrgane.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : selectedParc ? (
                <div className="mt-3 p-3 bg-muted/30 rounded border">
                  <p className="text-sm text-muted-foreground">
                    Aucun type d'organe associé à ce parc. Utilisez l'outil de
                    gestion des associations pour lier des types d'organes à ce
                    parc.
                  </p>
                </div>
              ) : null}
            </div>

            {/* Champs du formulaire */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <FormField
                  form={form}
                  name="name"
                  label="Nom de l'organe"
                  placeholder="..."
                  disabled={isSubmitting}
                />

                <FormField
                  form={form}
                  name="marque"
                  label="Marque"
                  placeholder="..."
                  disabled={isSubmitting}
                />

                <FormField
                  form={form}
                  name="sn"
                  label="Numéro de série"
                  placeholder="..."
                  disabled={isSubmitting}
                />

                <FormField
                  form={form}
                  name="date_mes"
                  label="Date de mise en service"
                  type="date"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-4">
                <form.Field name="origine">
                  {(field) => (
                    <Field className="gap-0.5">
                      <FieldLabel htmlFor="origine">Origine</FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(value) => field.handleChange(value)}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
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

                <FormField
                  form={form}
                  name="circuit"
                  label="Circuit"
                  placeholder="..."
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

                <FormField
                  form={form}
                  name="obs"
                  label="Observations"
                  placeholder="..."
                  disabled={isSubmitting}
                />

                <form.Field name="active">
                  {(field) => (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="active"
                        checked={field.state.value}
                        onChange={(e) => field.handleChange(e.target.checked)}
                        disabled={isSubmitting}
                      />
                      <label htmlFor="active" className="text-sm font-medium">
                        Actif
                      </label>
                    </div>
                  )}
                </form.Field>
              </div>
            </div>
          </FieldGroup>

          <FormError error={error} />

          <DialogFooter>
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
            <Button type="submit" disabled={isSubmitting} size="sm">
              {isSubmitting ? (
                <Spinner className="h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Créer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewOrgane;
