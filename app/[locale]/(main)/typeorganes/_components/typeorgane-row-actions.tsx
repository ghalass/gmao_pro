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
import EditTypeorgane from "./edit-typeorgane";
import DeleteTypeorgane from "./delete-typeorgane";

interface TypeorganeRowActionsProps {
  typeorgane: any;
  onTypeorganeUpdated?: () => void;
}

const TypeorganeRowActions = ({
  typeorgane,
  onTypeorganeUpdated,
}: TypeorganeRowActionsProps) => {
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

      <EditTypeorgane
        typeorgane={typeorgane}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={onTypeorganeUpdated}
      />

      <DeleteTypeorgane
        typeorgane={typeorgane}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onSuccess={onTypeorganeUpdated}
      />
    </>
  );
};

export default TypeorganeRowActions;
