"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { API, apiFetch } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

interface TypeParc {
  id: string;
  name: string;
}

interface Parc {
  id: string;
  name: string;
  typeparcId: string;
}

interface TypeOrgane {
  id: string;
  name: string;
}

interface HierarchicalSelectorProps {
  selectedTypeOrganeId?: string;
  onTypeOrganeChange: (typeOrganeId: string) => void;
  disabled?: boolean;
  label?: string;
}

const HierarchicalSelector = ({
  selectedTypeOrganeId,
  onTypeOrganeChange,
  disabled = false,
  label = "Type d'organe",
}: HierarchicalSelectorProps) => {
  const [typeParcs, setTypeParcs] = useState<TypeParc[]>([]);
  const [parcs, setParcs] = useState<Parc[]>([]);
  const [typeOrganes, setTypeOrganes] = useState<TypeOrgane[]>([]);

  const [selectedTypeParcId, setSelectedTypeParcId] = useState<string>("");
  const [selectedParcId, setSelectedParcId] = useState<string>("");

  const [isLoadingTypeParcs, setIsLoadingTypeParcs] = useState(false);
  const [isLoadingParcs, setIsLoadingParcs] = useState(false);
  const [isLoadingTypeOrganes, setIsLoadingTypeOrganes] = useState(false);

  // Refs pour éviter les boucles infinies
  const isInitializingRef = useRef(false);

  // Charger les types de parcs
  const loadTypeParcs = useCallback(async () => {
    try {
      setIsLoadingTypeParcs(true);
      const response = await apiFetch(API.TYPEPARCS.ALL);
      if (response.ok) {
        setTypeParcs(response.data || []);
      } else {
        console.error(
          "Erreur lors du chargement des types de parcs:",
          response.data
        );
      }
    } catch (error) {
      console.error("Erreur lors du chargement des types de parcs:", error);
    } finally {
      setIsLoadingTypeParcs(false);
    }
  }, []);

  // Charger les parcs selon le type de parc sélectionné
  const loadParcs = useCallback(async (typeParcId: string) => {
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
        console.error("Erreur lors du chargement des parcs:", response.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des parcs:", error);
    } finally {
      setIsLoadingParcs(false);
    }
  }, []);

  // Charger les types d'organes selon le parc sélectionné
  const loadTypeOrganes = useCallback(
    async (parcId: string) => {
      try {
        setIsLoadingTypeOrganes(true);

        // Récupérer tous les types d'organes avec leurs associations de parcs
        const allTypeOrganesResponse = await apiFetch(API.TYPEORGANES.ALL);

        if (allTypeOrganesResponse.ok) {
          const allTypeOrganes = allTypeOrganesResponse.data || [];

          // Filtrer les types d'organes qui sont associés au parc sélectionné
          const associatedTypeOrganes = allTypeOrganes.filter(
            (typeOrgane: any) => {
              return typeOrgane.typeOrganeParcs?.some(
                (tp: any) => tp.parc.id === parcId
              );
            }
          );

          if (associatedTypeOrganes.length > 0) {
            console.log(
              `✅ Parc "${parcId}" a ${associatedTypeOrganes.length} types d'organes associés:`,
              associatedTypeOrganes.map((to: any) => to.name)
            );
            setTypeOrganes(associatedTypeOrganes);
          } else {
            console.log(
              `⚠️ Parc "${parcId}" n'a pas de types d'organes associés`
            );
            console.log("📝 Le select TypeOrgane restera vide");

            // Si aucun type d'organe n'est associé, laisser le select vide
            // MAIS préserver la sélection si elle existe et est valide
            if (selectedTypeOrganeId) {
              const isStillValid = allTypeOrganes.some(
                (to: any) => to.id === selectedTypeOrganeId
              );
              if (isStillValid) {
                // Garder le typeOrgane sélectionné même s'il n'est pas associé à ce parc
                setTypeOrganes(
                  allTypeOrganes.filter(
                    (to: any) => to.id === selectedTypeOrganeId
                  )
                );
              } else {
                setTypeOrganes([]);
              }
            } else {
              setTypeOrganes([]);
            }
          }
        } else {
          console.error(
            "❌ Erreur lors de la récupération des types d'organes:",
            allTypeOrganesResponse.data
          );
          // En cas d'erreur, laisser le select vide
          setTypeOrganes([]);
        }
      } catch (error) {
        console.error(
          "❌ Erreur lors du chargement des types d'organes:",
          error
        );

        // En cas d'erreur, laisser le select vide
        setTypeOrganes([]);
      } finally {
        setIsLoadingTypeOrganes(false);
      }
    },
    [selectedTypeOrganeId]
  );

  // Charger les types de parcs au montage
  useEffect(() => {
    loadTypeParcs();
  }, [loadTypeParcs]);

  // Charger les parcs quand un type de parc est sélectionné
  useEffect(() => {
    if (selectedTypeParcId && !isInitializingRef.current) {
      loadParcs(selectedTypeParcId);

      // Reset des sélections suivantes SEULEMENT si elles ne correspondent plus au typeparc
      if (selectedParcId) {
        // Vérifier si le parc sélectionné appartient toujours au typeparc
        const currentParc = parcs.find((p) => p.id === selectedParcId);
        if (!currentParc || currentParc.typeparcId !== selectedTypeParcId) {
          setSelectedParcId("");
          setTypeOrganes([]);
          onTypeOrganeChange("");
        }
      } else {
        // Si aucun parc n'est sélectionné, vider les types d'organes
        setTypeOrganes([]);
        onTypeOrganeChange("");
      }
    }
  }, [selectedTypeParcId, loadParcs, onTypeOrganeChange, selectedParcId]);

  // Charger les types d'organes quand un parc est sélectionné
  useEffect(() => {
    if (selectedParcId && !isInitializingRef.current) {
      // Ne pas vider la sélection pendant le chargement
      loadTypeOrganes(selectedParcId);
    } else if (!selectedParcId && !isInitializingRef.current) {
      // Si aucun parc n'est sélectionné, vider les types d'organes
      // MAIS préserver la sélection si elle existe
      if (selectedTypeOrganeId) {
        // Garder le typeOrgane sélectionné même si aucun parc n'est choisi
        // pour éviter de perdre la sélection pendant les transitions
        return;
      }
      setTypeOrganes([]);
      onTypeOrganeChange("");
    }
  }, [
    selectedParcId,
    loadTypeOrganes,
    onTypeOrganeChange,
    selectedTypeOrganeId,
  ]);

  // Initialiser les sélections quand selectedTypeOrganeId est fourni (mode édition)
  useEffect(() => {
    if (selectedTypeOrganeId && !isInitializingRef.current) {
      isInitializingRef.current = true;

      const initializeFromTypeOrgane = async () => {
        try {
          // Charger toutes les données nécessaires en parallèle
          const [
            allTypeOrganesResponse,
            allParcsResponse,
            allTypeParcsResponse,
          ] = await Promise.all([
            apiFetch(API.TYPEORGANES.ALL),
            apiFetch(API.PARCS.ALL),
            apiFetch(API.TYPEPARCS.ALL),
          ]);

          if (
            allTypeOrganesResponse.ok &&
            allParcsResponse.ok &&
            allTypeParcsResponse.ok
          ) {
            const allTypeOrganes = allTypeOrganesResponse.data || [];
            const allParcs = allParcsResponse.data || [];
            const allTypeParcs = allTypeParcsResponse.data || [];

            const currentTypeOrgane = allTypeOrganes.find(
              (to: any) => to.id === selectedTypeOrganeId
            );

            if (
              currentTypeOrgane &&
              currentTypeOrgane.typeOrganeParcs?.length > 0
            ) {
              // Prendre le premier parc associé
              const firstAssociation = currentTypeOrgane.typeOrganeParcs[0];
              const parcId = firstAssociation.parc.id;
              const parc = allParcs.find((p: any) => p.id === parcId);

              if (parc) {
                // Filtrer les parcs pour ce type de parc
                const filteredParcs = allParcs.filter(
                  (p: Parc) => p.typeparcId === parc.typeparcId
                );

                // Filtrer les types d'organes associés à ce parc
                const associatedTypeOrganes = allTypeOrganes.filter(
                  (to: any) => {
                    return to.typeOrganeParcs?.some(
                      (tp: any) => tp.parc.id === parcId
                    );
                  }
                );

                // Mise à jour synchrone de tous les états
                setTypeParcs(allTypeParcs);
                setSelectedTypeParcId(parc.typeparcId);
                setParcs(filteredParcs);
                setSelectedParcId(parcId);
                setTypeOrganes(associatedTypeOrganes);

                console.log("✅ Initialisation hiérarchique complète:", {
                  typeParcId: parc.typeparcId,
                  parcId: parcId,
                  typeOrganeId: selectedTypeOrganeId,
                  availableTypeOrganes: associatedTypeOrganes.length,
                });
              }
            }
          }
        } catch (error) {
          console.error(
            "Erreur lors de l'initialisation depuis le typeOrgane:",
            error
          );
        } finally {
          // Délai court pour permettre aux états de se stabiliser
          setTimeout(() => {
            isInitializingRef.current = false;
          }, 100);
        }
      };

      initializeFromTypeOrgane();
    }
  }, [selectedTypeOrganeId]);

  return (
    <div className="space-y-3">
      {/* Sélection du type de parc */}
      <Field className="gap-1">
        <FieldLabel className="text-sm">Type de parc</FieldLabel>
        <Select
          value={selectedTypeParcId}
          onValueChange={setSelectedTypeParcId}
          disabled={disabled || isLoadingTypeParcs}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Sélectionner un type de parc" />
            {isLoadingTypeParcs && <Spinner className="h-4 w-4 ml-2" />}
          </SelectTrigger>
          <SelectContent>
            {typeParcs.map((typeParc) => (
              <SelectItem key={typeParc.id} value={typeParc.id}>
                {typeParc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {/* Sélection du parc */}
      <Field className="gap-1">
        <FieldLabel className="text-sm">Parc</FieldLabel>
        <Select
          value={selectedParcId}
          onValueChange={setSelectedParcId}
          disabled={disabled || !selectedTypeParcId || isLoadingParcs}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Sélectionner un parc" />
            {isLoadingParcs && <Spinner className="h-4 w-4 ml-2" />}
          </SelectTrigger>
          <SelectContent>
            {parcs.map((parc) => (
              <SelectItem key={parc.id} value={parc.id}>
                {parc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {/* Sélection du type d'organe */}
      <Field className="gap-1">
        <FieldLabel className="text-sm">{label}</FieldLabel>
        <Select
          value={selectedTypeOrganeId}
          onValueChange={onTypeOrganeChange}
          disabled={disabled || !selectedParcId || isLoadingTypeOrganes}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Sélectionner un type d'organe" />
            {isLoadingTypeOrganes && <Spinner className="h-4 w-4 ml-2" />}
          </SelectTrigger>
          <SelectContent>
            {/* Toujours inclure le typeOrgane sélectionné s'il existe */}
            {selectedTypeOrganeId &&
              !typeOrganes.some((to) => to.id === selectedTypeOrganeId) && (
                <SelectItem
                  key={selectedTypeOrganeId}
                  value={selectedTypeOrganeId}
                >
                  TypeOrgane sélectionné
                </SelectItem>
              )}
            {typeOrganes.map((typeOrgane) => (
              <SelectItem key={typeOrgane.id} value={typeOrgane.id}>
                {typeOrgane.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
};

export default HierarchicalSelector;
