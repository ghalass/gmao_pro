"use client";

import { API, apiFetch, methods } from "@/lib/api";
import { Engin, Site } from "@/lib/generated/prisma/client";
import { Plus, Save, Calendar as CalendarIcon } from "lucide-react";
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

const NewSaisiehrm = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [typeparcs, setTypeparcs] = useState<any[]>([]);
  const [parcs, setParcs] = useState<any[]>([]);
  const [engins, setEngins] = useState<any[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoadingRelations, setIsLoadingRelations] = useState(false);

  const [selectedTypeparcId, setSelectedTypeparcId] = useState<string>("");
  const [selectedParcId, setSelectedParcId] = useState<string>("");

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
      du: yup.string().required().label("Date"),
      enginId: yup.string().required().label("Engin"),
      siteId: yup.string().required().label("Site"),
      hrm: yup.number().positive().required().label("HRM"),
      compteur: yup.number().nullable().label("Compteur"),
    });
  }, [locale]);

  const fetchRelations = useCallback(async () => {
    try {
      setIsLoadingRelations(true);
      const [typeparcsRes, parcsRes, enginsRes, sitesRes] = await Promise.all([
        apiFetch(API.TYPEPARCS.ALL),
        apiFetch(API.PARCS.ALL),
        apiFetch(API.ENGINS.ALL),
        apiFetch(API.SITES.ALL),
      ]);

      if (typeparcsRes.ok) setTypeparcs(typeparcsRes.data);
      if (parcsRes.ok) setParcs(parcsRes.data);
      if (enginsRes.ok) setEngins(enginsRes.data);
      if (sitesRes.ok) setSites(sitesRes.data);

      if (!typeparcsRes.ok || !parcsRes.ok || !enginsRes.ok || !sitesRes.ok) {
        toast.error("Erreur lors du chargement des données liées");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsLoadingRelations(false);
    }
  }, []);

  const form = useForm({
    defaultValues: {
      du: new Date().toISOString().split("T")[0],
      enginId: "",
      siteId: "",
      hrm: "" as unknown as number,
      compteur: "" as unknown as number,
    },
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true);
        setError(null);

        await schema.validate(value, { abortEarly: false });

        const response = await apiFetch(API.SAISIEHRMS.CREATE, {
          method: methods.POST,
          body: {
            ...value,
            hrm: parseFloat(value.hrm.toString()),
            compteur: value.compteur
              ? parseFloat(value.compteur.toString())
              : null,
          },
        });

        if (response.ok) {
          router.refresh();
          toast.success("Saisie HRM créée avec succès");
          setModalOpen(false);
          form.reset();
        } else {
          setError(response.data.message);
          toast.error(response.data.message || "Erreur lors de la création");
        }
      } catch (err: any) {
        if (err.name === "ValidationError") {
          setError(err.errors.join(", "));
        } else {
          setError(err.message || "Erreur lors de la création");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (modalOpen) {
      form.reset();
      setError(null);
      setSelectedTypeparcId("");
      setSelectedParcId("");
      fetchRelations();
    } else {
      setError(null);
      setSelectedTypeparcId("");
      setSelectedParcId("");
      form.reset();
    }
  }, [modalOpen, form, fetchRelations]);

  // Options filtrées
  const filteredParcs = parcs.filter(
    (p) =>
      !selectedTypeparcId ||
      selectedTypeparcId === "ALL" ||
      p.typeparcId === selectedTypeparcId
  );

  const filteredSites = sites.filter((s) => {
    if (!selectedParcId) return true;
    return engins.some((e) => e.parcId === selectedParcId && e.siteId === s.id);
  });

  const filteredEngins = engins.filter((e) => {
    if (selectedParcId && e.parcId !== selectedParcId) return false;
    const currentSiteId = form.getFieldValue("siteId");
    if (currentSiteId && e.siteId !== currentSiteId) return false;
    return true;
  });

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle saisie
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nouvelle saisie HRM</DialogTitle>
          <DialogDescription>
            Enregistrer les heures réelles d'un engin.
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

            <FormField
              form={form}
              name="du"
              label="Date"
              type="date"
              disabled={isSubmitting}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type Parc</label>
                <Select
                  value={selectedTypeparcId || "ALL"}
                  onValueChange={(value) => {
                    setSelectedTypeparcId(value === "ALL" ? "" : value);
                    setSelectedParcId("");
                    form.setFieldValue("enginId", "");
                  }}
                  disabled={isSubmitting || isLoadingRelations}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Tous les types" />
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Parc</label>
                <Select
                  value={selectedParcId}
                  onValueChange={(value) => {
                    setSelectedParcId(value);
                    form.setFieldValue("enginId", "");
                  }}
                  disabled={
                    isSubmitting ||
                    isLoadingRelations ||
                    (!selectedTypeparcId && selectedTypeparcId !== "")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un parc" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredParcs.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <FormSelectField
              form={form}
              name="siteId"
              label="Site"
              options={filteredSites.map((s) => ({
                label: s.name,
                value: s.id,
              }))}
              disabled={isSubmitting || isLoadingRelations}
              placeholder="Sélectionner un site"
              onChange={() => {
                form.setFieldValue("enginId", "");
              }}
            />

            <FormSelectField
              form={form}
              name="enginId"
              label="Engin"
              options={filteredEngins.map((e) => ({
                label: e.name,
                value: e.id,
              }))}
              disabled={
                isSubmitting ||
                isLoadingRelations ||
                !selectedParcId ||
                !form.getFieldValue("siteId")
              }
              placeholder="Sélectionner un engin"
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                form={form}
                name="hrm"
                label="HRM"
                type="number"
                disabled={isSubmitting}
              />
              <FormField
                form={form}
                name="compteur"
                label="Compteur (optionnel)"
                type="number"
                disabled={isSubmitting}
              />
            </div>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Création...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewSaisiehrm;
