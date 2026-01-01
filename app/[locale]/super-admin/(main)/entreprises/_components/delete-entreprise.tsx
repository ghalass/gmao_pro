"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, AlertTriangle } from "lucide-react";

interface Entreprise {
  id: string;
  name: string;
  lang: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
    sites: number;
    engins: number;
  };
}

interface DeleteEntrepriseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  entreprise: Entreprise | null;
}

export const DeleteEntrepriseDialog: React.FC<DeleteEntrepriseDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  entreprise,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const handleDelete = async () => {
    if (!entreprise) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/super-admin/entreprises/${entreprise.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        onSuccess();
        onOpenChange(false);
      } else {
        const result = await response.json();
        setError(result.message || "Erreur lors de la suppression");
      }
    } catch (error) {
      setError("Erreur réseau");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-96">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Supprimer l'Entreprise
          </DialogTitle>
          <DialogDescription>
            Cette action est irréversible et supprimera toutes les données
            associées
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {entreprise && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{entreprise.name}</strong> contient :
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>{entreprise._count.users} utilisateur(s)</li>
                  <li>{entreprise._count.sites} site(s)</li>
                  <li>{entreprise._count.engins} engin(s)</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
