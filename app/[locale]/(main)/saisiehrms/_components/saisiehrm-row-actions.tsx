"use client";

import { Saisiehrm, Engin, Site } from "@/lib/generated/prisma/client";
import { MoreVertical, Pencil, Trash, Activity } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditSaisiehrm from "./edit-saisiehrm";
import DeleteSaisiehrm from "./delete-saisiehrm";
import ManageHims from "./manage-hims";

type SaisiehrmWithRelations = Saisiehrm & {
  engin: Engin;
  site: Site;
};

interface SaisiehrmRowActionsProps {
  saisiehrm: SaisiehrmWithRelations;
}

const SaisiehrmRowActions = ({ saisiehrm }: SaisiehrmRowActionsProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showManageHims, setShowManageHims] = useState(false);

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowManageHims(true)}>
            <Activity className="mr-2 h-4 w-4" />
            Gérer les HIM
          </DropdownMenuItem>
          <DropdownMenuSeparator />
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

      <ManageHims
        saisiehrm={saisiehrm}
        open={showManageHims}
        onOpenChange={setShowManageHims}
      />

      <EditSaisiehrm
        saisiehrm={saisiehrm}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />

      <DeleteSaisiehrm
        saisiehrm={saisiehrm}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </>
  );
};

export default SaisiehrmRowActions;
