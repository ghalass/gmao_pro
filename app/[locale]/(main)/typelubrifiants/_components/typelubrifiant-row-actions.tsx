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
import EditTypelubrifiant from "./edit-typelubrifiant";
import DeleteTypelubrifiant from "./delete-typelubrifiant";

interface TypelubrifiantRowActionsProps {
  typelubrifiant: any;
  onTypelubrifiantUpdated?: () => void;
}

const TypelubrifiantRowActions = ({
  typelubrifiant,
  onTypelubrifiantUpdated,
}: TypelubrifiantRowActionsProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Menu</span>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <Trash className="mr-2 h-4 w-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditTypelubrifiant
        typelubrifiant={typelubrifiant}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={onTypelubrifiantUpdated}
      />

      <DeleteTypelubrifiant
        typelubrifiant={typelubrifiant}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onSuccess={onTypelubrifiantUpdated}
      />
    </>
  );
};

export default TypelubrifiantRowActions;
