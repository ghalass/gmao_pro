"use client";
import { API, apiFetch, methods } from "@/lib/api";
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
  DialogTrigger,
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

interface NewObjectifProps {
  parcs: any[];
  sites: any[];
  typeparcs: any[];
}

const NewObjectif = ({ parcs, sites, typeparcs }: NewObjectifProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();
  const locale = useCurrentLocale();

  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedTypeparcId, setSelectedTypeparcId] = useState<string>("ALL");

  // Créer le schéma avec traductions
  const newObjectifSchema = React.useMemo(() => {
    if (locale === "ar") {
      yup.setLocale(ar);
    } else {
      yup.setLocale(fr);
    }

    return yup.object({
      annee: yup
        .number()
        .integer()
        .min(1900, "L'année doit être >= 1900")
        .max(2100)
        .test(
          "is-4-digits",
          "L'année doit être composée de 4 chiffres",
          (value) => {
            if (!value) return false;
            const yearStr = value.toString();
            return yearStr.length === 4 && /^\d{4}$/.test(yearStr);
          }
        )
        .required()
        .label("Année"),
      parcId: yup.string().required().label("Parc"),
      siteId: yup.string().required().label("Site"),
      dispo: yup
        .number()
        .nullable()
        .min(0, "La disponibilité doit être >= 0")
        .max(100, "La disponibilité doit être <= 100")
        .label("Disponibilité"),
      mtbf: yup
        .number()
        .nullable()
        .min(0, "Le MTBF doit être >= 0")
        .label("MTBF"),
      tdm: yup
        .number()
        .nullable()
        .min(0, "Le TDM doit être >= 0")
        .max(100, "Le TDM doit être <= 100")
        .label("TDM"),
      spe_huile: yup
        .number()
        .nullable()
        .min(0, "La spécification huile doit être >= 0")
        .label("Spécification Huile"),
      spe_go: yup
        .number()
        .nullable()
        .min(0, "La spécification GO doit être >= 0")
        .label("Spécification GO"),
      spe_graisse: yup
        .number()
        .nullable()
        .min(0, "La spécification graisse doit être >= 0")
        .label("Spécification Graisse"),
    });
  }, [locale]);

  // Fonction de validation pour chaque champ
  const validateField = useCallback(
    (fieldName: string, value: any) => {
      try {
        newObjectifSchema.validateSyncAt(fieldName, {
          [fieldName]: value,
        });
        return undefined;
      } catch (err: any) {
        return err.message;
      }
    },
    [newObjectifSchema]
  );

  // Fonction de création d'objectif
  const createObjectifResponse = useCallback(async (data: any) => {
    return apiFetch(API.OBJECTIFS.OBJECTIF_CREATE, {
      method: methods.POST,
      body: data,
    });
  }, []);

  const form = useForm({
    defaultValues: {
      annee: new Date().getFullYear().toString(),
      parcId: "",
      siteId: "",
      dispo: "",
      mtbf: "",
      tdm: "",
      spe_huile: "",
      spe_go: "",
      spe_graisse: "",
    },
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true);
        setError(null);

        // Préparer les données pour l'API
        const dataToSend: any = {
          annee: value.annee,
          parcId: value.parcId,
          siteId: value.siteId,
        };

        // Ajouter les valeurs numériques optionnelles seulement si elles sont remplies
        if (value.dispo && value.dispo.trim() !== "") {
          dataToSend.dispo = value.dispo;
        }
        if (value.mtbf && value.mtbf.trim() !== "") {
          dataToSend.mtbf = value.mtbf;
        }
        if (value.tdm && value.tdm.trim() !== "") {
          dataToSend.tdm = value.tdm;
        }
        if (value.spe_huile && value.spe_huile.trim() !== "") {
          dataToSend.spe_huile = value.spe_huile;
        }
        if (value.spe_go && value.spe_go.trim() !== "") {
          dataToSend.spe_go = value.spe_go;
        }
        if (value.spe_graisse && value.spe_graisse.trim() !== "") {
          dataToSend.spe_graisse = value.spe_graisse;
        }

        // Valider avec le schéma
        await newObjectifSchema.validate(dataToSend, { abortEarly: false });

        // Utiliser la fonction de création
        const response = await createObjectifResponse(dataToSend);

        if (response.ok) {
          router.refresh();
          toast.success(`Objectif créé avec succès`);
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

  // Fonction de validation pour FormField
  const getFieldValidator = useCallback(
    (fieldName: string) => {
      return (value: any) => {
        return validateField(fieldName, value);
      };
    },
    [validateField]
  );

  // Réinitialiser le form quand le modal s'ouvre
  useEffect(() => {
    if (modalOpen) {
      form.reset({
        annee: new Date().getFullYear().toString(),
        parcId: "",
        siteId: "",
        dispo: "",
        mtbf: "",
        tdm: "",
        spe_huile: "",
        spe_go: "",
        spe_graisse: "",
      });
      setSelectedTypeparcId("ALL");
      setError(null);
    } else {
      setError(null);
      setSelectedTypeparcId("ALL");
      form.reset();
    }
  }, [modalOpen, form]);

  // Gérer la fermeture du modal
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setError(null);
    }

    if (!isSubmitting) {
      setModalOpen(open);
    }
  };

  // Filtrer les parcs en fonction du typeparc sélectionné
  const filteredParcs = parcs.filter(
    (parc) =>
      selectedTypeparcId === "ALL" || parc.typeparcId === selectedTypeparcId
  );

  // Préparer les options pour les selects
  const parcOptions = filteredParcs.map((parc) => ({
    label: `${parc.name}${parc.typeparc ? ` (${parc.typeparc.name})` : ""}`,
    value: parc.id,
  }));

  const siteOptions = sites.map((site) => ({
    label: site.name,
    value: site.id,
  }));

  return (
    <Dialog open={modalOpen} onOpenChange={handleOpenChange}>
      <form
        id="new-objectif-form"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <DialogTrigger asChild>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nouvel objectif
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un nouvel objectif</DialogTitle>
            <DialogDescription>
              Définissez les objectifs pour une année, un parc et un site.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-1">
            <FormError error={error} />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                form={form}
                name="annee"
                label="Année"
                type="number"
                min="1900"
                max="2100"
                customValidator={getFieldValidator("annee")}
                disabled={isSubmitting}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">Type de parc</label>
                <Select
                  value={selectedTypeparcId || "ALL"}
                  onValueChange={(value) => {
                    setSelectedTypeparcId(value);
                    form.setFieldValue("parcId", "");
                  }}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un type de parc" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tous les types</SelectItem>
                    {typeparcs.map((tp) => (
                      <SelectItem key={tp.id} value={tp.id}>
                        {tp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <FormSelectField
              form={form}
              name="parcId"
              label="Parc"
              options={parcOptions}
              placeholder="Sélectionner un parc"
              customValidator={getFieldValidator("parcId")}
              disabled={isSubmitting}
              required
            />

            <FormSelectField
              form={form}
              name="siteId"
              label="Site"
              options={siteOptions}
              placeholder="Sélectionner un site"
              customValidator={getFieldValidator("siteId")}
              disabled={isSubmitting}
              required
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                form={form}
                name="dispo"
                label="Disponibilité (%)"
                type="number"
                step="0.01"
                min="0"
                max="100"
                customValidator={getFieldValidator("dispo")}
                disabled={isSubmitting}
              />

              <FormField
                form={form}
                name="mtbf"
                label="MTBF"
                type="number"
                step="0.01"
                min="0"
                customValidator={getFieldValidator("mtbf")}
                disabled={isSubmitting}
              />

              <FormField
                form={form}
                name="tdm"
                label="TDM"
                type="number"
                step="0.01"
                min="0"
                max="100"
                customValidator={getFieldValidator("tdm")}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Spécifications</div>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  form={form}
                  name="spe_huile"
                  label="Huile"
                  type="number"
                  step="0.01"
                  min="0"
                  customValidator={getFieldValidator("spe_huile")}
                  disabled={isSubmitting}
                />

                <FormField
                  form={form}
                  name="spe_go"
                  label="GO"
                  type="number"
                  step="0.01"
                  min="0"
                  customValidator={getFieldValidator("spe_go")}
                  disabled={isSubmitting}
                />

                <FormField
                  form={form}
                  name="spe_graisse"
                  label="Graisse"
                  type="number"
                  step="0.01"
                  min="0"
                  customValidator={getFieldValidator("spe_graisse")}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </FieldGroup>

          <DialogFooter>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setError(null);
                  setSelectedTypeparcId("ALL");
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
                form="new-objectif-form"
                disabled={isSubmitting}
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
                    Créer l'objectif
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

export default NewObjectif;
