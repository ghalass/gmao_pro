"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Eye, Users } from "lucide-react";

interface Entreprise {
  id: string;
  name: string;
  lang: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EntrepriseActionsProps {
  entreprise: Entreprise;
  onView: (entreprise: Entreprise) => void;
  onEdit: (entreprise: Entreprise) => void;
  onDelete: (entreprise: Entreprise) => void;
  onViewUsers?: (entreprise: Entreprise) => void;
}

export const EntrepriseActions: React.FC<EntrepriseActionsProps> = ({
  entreprise,
  onView,
  onEdit,
  onDelete,
  onViewUsers,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Actions</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onView(entreprise)}>
          <Eye className="mr-2 h-4 w-4" />
          Voir les détails
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(entreprise)}>
          <Edit className="mr-2 h-4 w-4" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onViewUsers?.(entreprise)}>
          <Users className="mr-2 h-4 w-4" />
          Voir les utilisateurs
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(entreprise)}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
