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
import EditObjectif from "./edit-objectif";
import DeleteObjectif from "./delete-objectif";

type ObjectifWithRelations = {
  id: string;
  annee: number;
  parcId: string;
  siteId: string;
  dispo: number | null;
  mtbf: number | null;
  tdm: number | null;
  spe_huile: number | null;
  spe_go: number | null;
  spe_graisse: number | null;
  parc: {
    id: string;
    name: string;
    typeparc?: {
      id: string;
      name: string;
    } | null;
  };
  site: {
    id: string;
    name: string;
  };
};

interface ObjectifRowActionsProps {
  objectif: ObjectifWithRelations;
  parcs: any[];
  sites: any[];
  typeparcs: any[];
  onObjectifUpdated?: () => void;
}

const ObjectifRowActions = ({
  objectif,
  parcs,
  sites,
  typeparcs,
}: ObjectifRowActionsProps) => {
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

      <EditObjectif
        objectif={objectif}
        parcs={parcs}
        sites={sites}
        typeparcs={typeparcs}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />

      <DeleteObjectif
        objectif={objectif}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </>
  );
};

export default ObjectifRowActions;
