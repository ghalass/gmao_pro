"use client";

import { API, apiFetch, methods } from "@/lib/api";
import { Trash } from "lucide-react";
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
import FormError from "@/components/form/FormError";
import { Organe, TypeOrgane } from "@/lib/generated/prisma/client";

interface DeleteOrganeProps {
  organe: Organe & { type_organe: TypeOrgane };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DeleteOrgane = ({ organe, open, onOpenChange }: DeleteOrganeProps) => {
  const [error, setError] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const router = useRouter();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);

      const response = await apiFetch(API.ORGANES.ORGANE_DELETE(organe.id), {
        method: methods.DELETE,
      });

      if (response.ok) {
        toast.success(`Organe supprimé avec succès`);
        onOpenChange(false);
        router.refresh();
      } else {
        const errorData = response.data?.message;
        toast.error(errorData || "Erreur lors de la suppression");
      }
    } catch (err: unknown) {
      console.error("Erreur de suppression:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Erreur lors de la suppression";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isDeleting) {
      if (!newOpen) {
        setError(null);
      }
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-lg text-destructive flex items-center gap-2">
            <Trash className="h-5 w-5" />
            Supprimer l&apos;organe
          </DialogTitle>
          <DialogDescription className="text-sm">
            Êtes-vous sûr de vouloir supprimer l&apos;organe{" "}
            <span className="font-semibold">{organe.name}</span> ? Cette action
            est irréversible.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20">
            <p className="text-sm font-medium text-destructive mb-2">
              Détails de l&apos;organe :
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm text-destructive/80">
              <div>
                <strong>Nom:</strong> {organe.name}
              </div>
              <div>
                <strong>Type:</strong> {organe.type_organe.name}
              </div>
              <div>
                <strong>Marque:</strong> {organe.marque || "N/A"}
              </div>
              <div>
                <strong>S/N:</strong> {organe.sn || "N/A"}
              </div>
            </div>
          </div>
          <FormError error={error} />
        </div>

        <DialogFooter className="pt-4 gap-2">
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
            {isDeleting && <Spinner className="mr-2 h-4 w-4" />}
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteOrgane;
