"use client";

import { API, apiFetch, methods } from "@/lib/api";
import { Saisiehrm, Engin } from "@/lib/generated/prisma/client";
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
import { getJoinedDate } from "@/lib/utils";

interface DeleteSaisiehrmProps {
  saisiehrm: Saisiehrm & { engin: Engin };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DeleteSaisiehrm = ({
  saisiehrm,
  open,
  onOpenChange,
}: DeleteSaisiehrmProps) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);

      const response = await apiFetch(API.SAISIEHRMS.DELETE(saisiehrm.id), {
        method: methods.DELETE,
      });

      if (response.ok) {
        router.refresh();
        toast.success("Saisie HRM supprimée avec succès");
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
            Supprimer la saisie HRM
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer cette saisie HRM ? Cette action
            est irréversible.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-100">
            <p className="text-sm font-medium text-red-800">
              Détails de la saisie :
            </p>
            <ul className="mt-2 text-sm text-red-700 space-y-1">
              <li>
                <strong>Date:</strong> {getJoinedDate(saisiehrm.du)}
              </li>
              <li>
                <strong>Engin:</strong> {saisiehrm.engin.name}
              </li>
              <li>
                <strong>HRM:</strong> {saisiehrm.hrm} hrs
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
              "Supprimer définitivement"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteSaisiehrm;
