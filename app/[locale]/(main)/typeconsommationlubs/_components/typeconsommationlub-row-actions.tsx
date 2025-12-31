"use client";

import { Typeconsommationlub } from "@/lib/generated/prisma/client";
import { MoreVertical, Pencil, Trash } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditTypeconsommationlub from "./edit-typeconsommationlub";
import DeleteTypeconsommationlub from "./delete-typeconsommationlub";

type TypeconsommationlubWithRelations = Typeconsommationlub & {
  parcs: {
    parc: {
      id: string;
      name: string;
      typeparc?: {
        id: string;
        name: string;
      } | null;
    };
  }[];
  _count: {
    saisielubrifiant: number;
  };
};

interface TypeconsommationlubRowActionsProps {
  typeconsommationlub: TypeconsommationlubWithRelations;
}

const TypeconsommationlubRowActions = ({
  typeconsommationlub,
}: TypeconsommationlubRowActionsProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

      <EditTypeconsommationlub
        typeconsommationlub={typeconsommationlub}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />

      <DeleteTypeconsommationlub
        typeconsommationlub={typeconsommationlub}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </>
  );
};

export default TypeconsommationlubRowActions;
