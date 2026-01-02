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
import EditTypeparc from "./edit-typeparc";
import DeleteTypeparc from "./delete-typeparc";
import { useTypeparcPermissions } from "@/hooks/usePermissions";

interface TypeparcRowActionsProps {
  typeparc: any;
  onTypeparcUpdated?: () => void;
}

const TypeparcRowActions = ({
  typeparc,
  onTypeparcUpdated,
}: TypeparcRowActionsProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const permissions = useTypeparcPermissions();

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

          <EditTypeparc
            typeparc={typeparc}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            onSuccess={onTypeparcUpdated}
          />

          <DeleteTypeparc
            typeparc={typeparc}
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            onSuccess={onTypeparcUpdated}
          />
        </>
      )}
    </>
  );
};

export default TypeparcRowActions;
