"use client";

import { User, Role } from "@/lib/generated/prisma/client";
import { MoreHorizontal, MoreVertical, Pencil, Trash } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditUser from "./edit-user";
import DeleteUser from "./delete-user";

type UserWithRoles = User & {
  roles: Role[];
};

interface UserRowActionsProps {
  user: UserWithRoles;
  onUserUpdated?: () => void;
}

const UserRowActions = ({ user, onUserUpdated }: UserRowActionsProps) => {
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

      <EditUser
        user={user}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={onUserUpdated}
      />

      <DeleteUser
        user={user}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onSuccess={onUserUpdated}
      />
    </>
  );
};

export default UserRowActions;
