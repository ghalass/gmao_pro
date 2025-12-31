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

interface DeleteTypeorganeProps {
  typeorgane: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DeleteTypeorgane = ({
  typeorgane,
  open,
  onOpenChange,
}: DeleteTypeorganeProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await apiFetch(
        API.TYPEORGANES.TYPEORGANE_DELETE(typeorgane.id),
        {
          method: methods.DELETE,
        }
      );

      if (response.ok) {
        toast.success(`Type d'organe supprimé avec succès`);
        onOpenChange(false);
        router.refresh();
      } else {
        const errorData = response.data?.message;
        toast.error(errorData || "Erreur lors de la suppression");
      }
    } catch (err: any) {
      console.error("Erreur de suppression:", err);
      toast.error(err.message || "Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!isDeleting) {
      onOpenChange(open);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Supprimer le type d'organe</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer le type{" "}
            <span className="font-semibold">{typeorgane.name}</span> ? Cette
            action est irréversible et ne peut être effectuée que si aucun
            organe n'y est rattaché.
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
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Suppression...
                </span>
              ) : (
                <span className="flex items-center gap-2">
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

export default DeleteTypeorgane;
