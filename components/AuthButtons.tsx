// components/AuthButtons.tsx - Version corrigée

"use client";

import { useUser } from "@/context/UserContext";
import { UserDetail } from "@/lib/types";
import Link from "next/link";
import { User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import LogoutButton from "./LogoutButton";
import { useScopedI18n } from "@/locales/client";

export default function AuthButtons() {
  const { user } = useUser();
  const tans = useScopedI18n("navbar");
  // Si user est null, afficher les boutons de connexion
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href={`/login`}
          className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors rounded-md"
        >
          {tans("authButtons.login")}
        </Link>
        <Link
          href={`/register`}
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-md shadow-sm"
        >
          {tans("authButtons.register")}
        </Link>
      </div>
    );
  }

  // Type assertion pour plus de sécurité
  const userDetail = user as UserDetail;

  // Vérification sécurisée pour les roles
  // Avec le nouveau type UserDetail, nous avons plusieurs options:
  const userRoles = userDetail.roles || [];
  const roleNames = userDetail.roleNames || [];
  const userPermissions = userDetail.permissions || [];

  // Extraire les noms de rôles selon la structure disponible
  let displayRoleNames: string;

  if (roleNames.length > 0) {
    // Utiliser user.roleNames si disponible (la propriété principale)
    displayRoleNames = roleNames.join(", ");
  } else if (userRoles.length > 0) {
    // Extraire les noms des objets Role
    displayRoleNames = userRoles
      .map((role) => {
        // Role peut être un objet avec une propriété 'name'
        if (typeof role === "object" && role !== null && "name" in role) {
          return (role as { name: string }).name;
        }
        // Ou Role peut être une chaîne (selon votre structure réelle)
        return typeof role === "string" ? role : "";
      })
      .filter(Boolean)
      .join(", ");
  } else {
    displayRoleNames = "";
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent transition-colors duration-200 group">
            <div className="w-8 h-8 bg-linear-to-br from-primary to-primary/70 rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
              {userDetail.name?.charAt(0).toUpperCase() || (
                <User className="w-4 h-4" />
              )}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium text-foreground">
                {userDetail.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {displayRoleNames ? (
                  <Badge variant="secondary" className="text-xs capitalize">
                    {displayRoleNames}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">
                    {tans("authButtons.noRoleText")}
                  </span>
                )}
              </div>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{userDetail.name}</p>
              <p className="text-xs text-muted-foreground">
                {userDetail.email}
              </p>
              {displayRoleNames && (
                <p className="text-xs text-muted-foreground capitalize">
                  {tans("authButtons.rolesTitle")}: {displayRoleNames}
                </p>
              )}
              {userPermissions.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {userPermissions.length} permission(s)
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link
              href="/profile"
              className="cursor-pointer flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              <span> {tans("authButtons.profile")}</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            asChild
            className="text-destructive focus:text-destructive"
          >
            <div className="cursor-pointer flex items-center gap-2">
              <LogoutButton />
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
