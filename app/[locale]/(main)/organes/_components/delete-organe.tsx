"use client";
import { API, apiFetch, methods } from "@/lib/api";
import { Organe, TypeOrgane } from "@/lib/generated/prisma/client";
import { AlertTriangle, Trash2 } from "lucide-react";
import React, { useState, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import FormError from "@/components/form/FormError";
import { Alert, AlertDescription } from "@/components/ui/alert";

type OrganeWithType = Organe & {
  type_organe: TypeOrgane;
};

const DeleteOrgane = ({
  organe,
  open,
  onOpenChange,
  onSuccess,
}: {
  organe: OrganeWithType;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}) => {
  const [internalOpen, setInternalOpen] = useState(false);

  // Use external control if provided, otherwise internal
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const modalOpen = isControlled ? open : internalOpen;
  const setModalOpen = isControlled ? onOpenChange : setInternalOpen;

  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [dependencies, setDependencies] = React.useState<any[]>([]);

  // Fonction pour vérifier les dépendances
  const checkDependencies = useCallback(async () => {
    try {
      // Vérifier les mouvements d'organe
      const mvtResponse = await apiFetch(
        `/api/organes/${organe.id}/mouvements`,
        {
          method: methods.GET,
        }
      );

      // Vérifier les révisions d'organe
      const revResponse = await apiFetch(
        `/api/organes/${organe.id}/revisions`,
        {
          method: methods.GET,
        }
      );

      const mvtData = mvtResponse.ok ? mvtResponse.data : [];
      const revData = revResponse.ok ? revResponse.data : [];

      const allDependencies = [
        ...(Array.isArray(mvtData)
          ? mvtData.map((m: any) => ({ type: "mouvement", data: m }))
          : []),
        ...(Array.isArray(revData)
          ? revData.map((r: any) => ({ type: "révision", data: r }))
          : []),
      ];

      setDependencies(allDependencies);
      return allDependencies;
    } catch (error) {
      console.error("Erreur lors de la vérification des dépendances:", error);
      return [];
    }
  }, [organe.id]);

  // Fonction de suppression d'organe
  const deleteOrganeResponse = useCallback(async (organeId: string) => {
    return apiFetch(API.ORGANES.ORGANE_DELETE(organeId), {
      method: methods.DELETE,
    });
  }, []);

  // Charger les dépendances quand le modal s'ouvre
  React.useEffect(() => {
    if (modalOpen) {
      checkDependencies();
    }
  }, [modalOpen, checkDependencies]);

  // Gérer la suppression
  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Vérifier s'il y a des dépendances
      if (dependencies.length > 0) {
        setError(
          `Impossible de supprimer cet organe car il a ${
            dependencies.length
          } dépendance(s) (${[...new Set(dependencies.map((d) => d.type))].join(
            ", "
          )})`
        );
        return;
      }

      const response = await deleteOrganeResponse(organe.id);

      if (response.ok) {
        router.refresh();
        toast.success(`Organe supprimé avec succès`);
        setModalOpen(false);
        onSuccess?.();
      } else {
        const errorData = response.data?.message;
        setError(errorData);
        toast.error(errorData || "Erreur lors de la suppression");
        console.error(errorData);
      }
    } catch (err: any) {
      console.error("Erreur de suppression:", err);
      setError(err.message || "Erreur lors de la suppression");
      toast.error(err.message || "Erreur lors de la suppression");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gérer la fermeture du modal
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setError(null);
      setDependencies([]);
    }

    if (!isSubmitting) {
      setModalOpen(open);
    }
  };

  return (
    <Dialog open={modalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-106">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Supprimer l'organe
          </DialogTitle>
          <DialogDescription>
            Cette action est irréversible. Veuillez confirmer la suppression de
            l'organe suivant :
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-md">
            <div className="font-medium">{organe.name}</div>
            <div className="text-sm text-muted-foreground">
              Type: {organe.type_organe?.name || "Non défini"}
            </div>
            {organe.marque && (
              <div className="text-sm text-muted-foreground">
                Marque: {organe.marque}
              </div>
            )}
            {organe.sn && (
              <div className="text-sm text-muted-foreground">
                N° Série: {organe.sn}
              </div>
            )}
          </div>

          {dependencies.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Cet organe ne peut pas être supprimé car il est utilisé dans :
                <ul className="mt-2 list-disc list-inside text-sm">
                  {dependencies.map((dep, index) => (
                    <li key={index}>
                      {dep.type} {dep.data.id ? `(#${dep.data.id})` : ""}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <FormError error={error} />
        </div>

        <DialogFooter>
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setError(null);
                setDependencies([]);
                setModalOpen(false);
              }}
              disabled={isSubmitting}
              size="sm"
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting || dependencies.length > 0}
              size="sm"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Suppression...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </span>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteOrgane;
