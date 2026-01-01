"use client";

import { useState } from "react";
import { API, apiFetch, methods } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface DeleteSaisieLubrifiantProps {
  saisieLubrifiant: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const DeleteSaisieLubrifiant = ({
  saisieLubrifiant,
  open,
  onOpenChange,
  onSuccess,
}: DeleteSaisieLubrifiantProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch(
        API.SAISIELUBRIFIANTS.DELETE(saisieLubrifiant.id),
        {
          method: methods.DELETE,
        }
      );

      if (response.ok) {
        toast.success("Consommation de lubrifiant supprimée avec succès");
        onSuccess();
        onOpenChange(false);
      } else {
        setError(response.data?.message || "Erreur lors de la suppression");
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Supprimer la consommation
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer cette consommation de lubrifiant
            ?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p>
                  <strong>Lubrifiant:</strong>{" "}
                  {saisieLubrifiant?.lubrifiant?.name}
                </p>
                <p>
                  <strong>Quantité:</strong> {saisieLubrifiant?.qte} L
                </p>
                {saisieLubrifiant?.typeconsommationlub && (
                  <p>
                    <strong>Type:</strong>{" "}
                    {saisieLubrifiant.typeconsommationlub.name}
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>

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
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteSaisieLubrifiant;
