"use client";

import { API, apiFetch, methods } from "@/lib/api";
import { Saisiehim, Panne } from "@/lib/generated/prisma/client";
import { Trash } from "lucide-react";
import React, { useState } from "react";
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

interface DeleteSaisiehimProps {
  saisiehim: Saisiehim & { panne: Panne };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const DeleteSaisiehim = ({
  saisiehim,
  open,
  onOpenChange,
  onSuccess,
}: DeleteSaisiehimProps) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);

      const response = await apiFetch(API.SAISIEHIMS.DELETE(saisiehim.id), {
        method: methods.DELETE,
      });

      if (response.ok) {
        router.refresh();
        toast.success("Saisie HIM supprimée avec succès");
        if (onSuccess) onSuccess();
        onOpenChange(false);
      } else {
        setError(response.data.message);
        toast.error(response.data.message || "Erreur lors de la suppression");
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de la suppression");
      toast.error(err.message || "Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-red-600 flex items-center gap-2">
            <Trash className="h-5 w-5" />
            Supprimer l'intervention
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer cette intervention HIM ?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-100">
            <p className="text-sm font-medium text-red-800">Détails :</p>
            <ul className="mt-2 text-sm text-red-700 space-y-1">
              <li>
                <strong>Panne:</strong> {saisiehim.panne.name}
              </li>
              <li>
                <strong>HIM:</strong> {saisiehim.him} hrs
              </li>
            </ul>
          </div>
          <FormError error={error} />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Suppression...
              </>
            ) : (
              "Supprimer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteSaisiehim;
