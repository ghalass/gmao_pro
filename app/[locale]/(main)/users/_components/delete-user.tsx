"use client";

import { API, apiFetch, methods } from "@/lib/api";
import { User, Role } from "@/lib/generated/prisma/client";
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

type UserWithRoles = User & {
  roles: Role[];
};

interface DeleteUserProps {
  user: UserWithRoles;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DeleteUser = ({ user, open, onOpenChange }: DeleteUserProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await apiFetch(API.USERS.USER_DELETE(user.id), {
        // Verify if DELETE endpoint exists or if it's the same URL with DELETE method
        method: methods.DELETE,
      });

      if (response.ok) {
        toast.success(`Utilisateur supprimé avec succès`);
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

  return (
    <Dialog open={open} onOpenChange={(o) => !isDeleting && onOpenChange(o)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Supprimer l'utilisateur</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer l'utilisateur{" "}
            <span className="font-semibold">{user.name}</span> ? Cette action
            est irréversible.
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

export default DeleteUser;
