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

interface DeleteEnginProps {
  engin: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DeleteEngin = ({ engin, open, onOpenChange }: DeleteEnginProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await apiFetch(API.ENGINS.ENGIN_DELETE(engin.id), {
        method: methods.DELETE,
      });

      if (response.ok) {
        toast.success(`Engin supprimé avec succès`);
        onOpenChange(false);
        router.refresh();
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
          <DialogTitle>Supprimer l'engin</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer l'engin{" "}
            <span className="font-semibold">{engin.name}</span> ? Cette action
            est irréversible et ne peut être effectuée que si aucun historique
            (saisies, anomalies) n'y est rattaché.
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

export default DeleteEngin;
