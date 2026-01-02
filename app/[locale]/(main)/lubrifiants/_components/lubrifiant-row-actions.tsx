"use client";

import { MoreVertical, Pencil, Trash } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditLubrifiant from "./edit-lubrifiant";
import DeleteLubrifiant from "./delete-lubrifiant";
import { useLubrifiantPermissions } from "@/hooks/usePermissions";

interface LubrifiantRowActionsProps {
  lubrifiant: any;
  typelubrifiants: any[];
  parcs: any[];
  onLubrifiantUpdated?: () => void;
}

const LubrifiantRowActions = ({
  lubrifiant,
  typelubrifiants,
  parcs,
  onLubrifiantUpdated,
}: LubrifiantRowActionsProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const permissions = useLubrifiantPermissions();

  return (
    <>
      {(permissions.update || permissions.delete) && (
        <>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {permissions.update && (
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Modifier
                </DropdownMenuItem>
              )}

              {permissions.delete && (
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <EditLubrifiant
            lubrifiant={lubrifiant}
            typelubrifiants={typelubrifiants}
            parcs={parcs}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            onSuccess={onLubrifiantUpdated}
          />

          <DeleteLubrifiant
            lubrifiant={lubrifiant}
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            onSuccess={onLubrifiantUpdated}
          />
        </>
      )}
    </>
  );
};

export default LubrifiantRowActions;
