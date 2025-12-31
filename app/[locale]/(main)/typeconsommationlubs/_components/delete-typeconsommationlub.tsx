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

interface DeleteTypeconsommationlubProps {
  typeconsommationlub: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const DeleteTypeconsommationlub = ({
  typeconsommationlub,
  open,
  onOpenChange,
  onSuccess,
}: DeleteTypeconsommationlubProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await apiFetch(
        API.TYPECONSOMMATIONLUBS.DELETE(typeconsommationlub.id),
        {
          method: methods.DELETE,
        }
      );

      if (response.ok) {
        toast.success(`Type de consommation supprimé avec succès`);
        onOpenChange(false);
        router.refresh();
        onSuccess?.();
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

  return (
    <Dialog open={open} onOpenChange={(o) => !isDeleting && onOpenChange(o)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Supprimer le type de consommation</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer le type de consommation{" "}
            <span className="font-semibold">{typeconsommationlub.name}</span> ?
            Cette action est irréversible.
            {typeconsommationlub._count?.saisielubrifiant > 0 && (
              <span className="block mt-2 text-red-600">
                Attention : Ce type est utilisé dans{" "}
                {typeconsommationlub._count.saisielubrifiant} saisie(s) de
                lubrifiant(s).
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <div className="flex w-full gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
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

export default DeleteTypeconsommationlub;
