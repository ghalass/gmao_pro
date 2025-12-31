"use client";
import { Organe, TypeOrgane } from "@/lib/generated/prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { useState } from "react";
import EditOrgane from "./edit-organe";
import DeleteOrgane from "./delete-organe";

type OrganeWithType = Organe & {
  type_organe: TypeOrgane;
};

interface OrganeRowActionsProps {
  organe: OrganeWithType;
  onOrganeUpdated?: () => void;
}

const OrganeRowActions = ({
  organe,
  onOrganeUpdated,
}: OrganeRowActionsProps) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Ouvrir le menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setEditModalOpen(true)}
            className="cursor-pointer"
          >
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteModalOpen(true)}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditOrgane
        organe={organe}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={onOrganeUpdated}
      />

      <DeleteOrgane
        organe={organe}
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onSuccess={onOrganeUpdated}
      />
    </>
  );
};

export default OrganeRowActions;
