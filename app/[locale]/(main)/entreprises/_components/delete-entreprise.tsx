"use client";

import { API, apiFetch, methods } from "@/lib/api";
import React from "react";
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
import { Trash2 } from "lucide-react";

interface DeleteEntrepriseProps {
  entreprise: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const DeleteEntreprise = ({
  entreprise,
  open,
  onOpenChange,
  onSuccess,
}: DeleteEntrepriseProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await apiFetch(
        API.ENTREPRISES.ENTREPRISE_DELETE(entreprise.id),
        {
          method: methods.DELETE,
        }
      );

      if (response.ok) {
        toast.success(`Entreprise supprimée avec succès`);
        onOpenChange(false);
        router.refresh();
        onSuccess?.();
      } else {
        toast.error(response.data?.message || "Erreur lors de la suppression");
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isDeleting && onOpenChange(o)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Supprimer l'entreprise</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer l'entreprise{" "}
            <span className="font-semibold">{entreprise.name}</span> ? Cette
            action est irréversible et entraînera la suppression de toutes les
            données associées (utilisateurs, sites, engins, etc.).
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <div className="flex w-full gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isDeleting}
              size="sm"
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              size="sm"
            >
              {isDeleting ? (
                <Spinner className="h-4 w-4 mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Supprimer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteEntreprise;
