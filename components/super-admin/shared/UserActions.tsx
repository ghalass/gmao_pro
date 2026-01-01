import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Key, Power, PowerOff } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  active: boolean;
  isOwner: boolean;
  isSuperAdmin: boolean;
  entreprise: {
    id: string;
    name: string;
  };
}

interface UserActionsProps {
  user: User;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onToggleActive: (user: User) => void;
  onResetPassword: (user: User) => void;
}

export const UserActions: React.FC<UserActionsProps> = ({
  user,
  onView,
  onEdit,
  onToggleActive,
  onResetPassword,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Ouvrir le menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onView(user)}>
          <Eye className="mr-2 h-4 w-4" />
          Voir les détails
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(user)}>
          <Edit className="mr-2 h-4 w-4" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onToggleActive(user)}>
          {user.active ? (
            <>
              <PowerOff className="mr-2 h-4 w-4" />
              Désactiver
            </>
          ) : (
            <>
              <Power className="mr-2 h-4 w-4" />
              Activer
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onResetPassword(user)}>
          <Key className="mr-2 h-4 w-4" />
          Réinitialiser le mot de passe
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
