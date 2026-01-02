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
import EditSite from "./edit-site";
import DeleteSite from "./delete-site";
import { useSitePermissions } from "@/hooks/usePermissions";

interface SiteRowActionsProps {
  site: any;
  onSiteUpdated?: () => void;
}

const SiteRowActions = ({ site, onSiteUpdated }: SiteRowActionsProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const permissions = useSitePermissions();

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

          <EditSite
            site={site}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            onSuccess={onSiteUpdated}
          />

          <DeleteSite
            site={site}
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            onSuccess={onSiteUpdated}
          />
        </>
      )}
    </>
  );
};

export default SiteRowActions;
