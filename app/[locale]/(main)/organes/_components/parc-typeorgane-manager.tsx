"use client";

import React, { useState, useEffect } from "react";
import { API, apiFetch, methods } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface Parc {
  id: string;
  name: string;
  typeOrganes?: Array<{ id: string; name: string }>;
}

interface TypeOrgane {
  id: string;
  name: string;
}

const ParcTypeOrganeManager = () => {
  const [parcs, setParcs] = useState<Parc[]>([]);
  const [typeOrganes, setTypeOrganes] = useState<TypeOrgane[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [parcsResponse, typeOrganesResponse] = await Promise.all([
        apiFetch(API.PARCS.ALL),
        apiFetch(API.TYPEORGANES.ALL),
      ]);

      if (parcsResponse.ok) setParcs(parcsResponse.data || []);
      if (typeOrganesResponse.ok)
        setTypeOrganes(typeOrganesResponse.data || []);
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const updateParcTypeOrganes = async (
    parcId: string,
    typeOrganeIds: string[]
  ) => {
    setSaving(parcId);
    try {
      // Cette API n'existe probablement pas encore, mais voici la structure
      const response = await apiFetch(API.PARCS.PARC_UPDATE(parcId), {
        method: methods.PATCH,
        body: {
          typeOrganeIds: typeOrganeIds,
        },
      });

      if (response.ok) {
        toast.success("Associations mises à jour");
        loadData(); // Recharger les données
      } else {
        toast.error("Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(null);
    }
  };

  const isTypeOrganeAssociated = (
    parc: Parc,
    typeOrganeId: string
  ): boolean => {
    return parc.typeOrganes?.some((to) => to.id === typeOrganeId) || false;
  };

  const handleCheckboxChange = (
    parc: Parc,
    typeOrganeId: string,
    checked: boolean
  ) => {
    const currentIds = parc.typeOrganes?.map((to) => to.id) || [];
    const newIds = checked
      ? [...currentIds, typeOrganeId]
      : currentIds.filter((id) => id !== typeOrganeId);

    updateParcTypeOrganes(parc.id, newIds);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <div className="p-4">Chargement des associations...</div>;
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">
          Gestion des Associations Parc-TypeOrgane
        </h2>
        <Button onClick={loadData} variant="outline">
          Actualiser
        </Button>
      </div>

      <div className="text-sm text-muted-foreground mb-4">
        Associez les types d&apos;organes aux parcs pour activer le filtrage
        hiérarchique.
      </div>

      {parcs.length === 0 ? (
        <Card className="p-4">
          <p>Aucun parc trouvé</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {parcs.map((parc) => (
            <Card key={parc.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{parc.name}</h3>
                <div className="text-sm text-muted-foreground">
                  {parc.typeOrganes?.length || 0} type(s) associé(s)
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {typeOrganes.map((typeOrgane) => (
                  <div
                    key={typeOrgane.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`${parc.id}-${typeOrgane.id}`}
                      checked={isTypeOrganeAssociated(parc, typeOrgane.id)}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange(
                          parc,
                          typeOrgane.id,
                          checked as boolean
                        )
                      }
                      disabled={saving === parc.id}
                    />
                    <label
                      htmlFor={`${parc.id}-${typeOrgane.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {typeOrgane.name}
                    </label>
                  </div>
                ))}
              </div>

              {saving === parc.id && (
                <div className="mt-2 text-sm text-blue-600">
                  Mise à jour en cours...
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2">Information</h4>
        <p className="text-sm text-blue-700">
          Cette interface permet de créer les associations nécessaires pour le
          filtrage hiérarchique. Une fois les associations créées, le sélecteur
          hiérarchique dans la création/modification d&apos;organes affichera
          uniquement les types d&apos;organes associés au parc sélectionné.
        </p>
      </Card>
    </div>
  );
};

export default ParcTypeOrganeManager;
