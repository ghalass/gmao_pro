import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Globe,
  Users,
  XCircle,
} from "lucide-react";

const EntreprisePageInfo = ({
  entreprise,
  users,
}: {
  entreprise: any;
  users: any;
}) => {
  return (
    <TooltipProvider>
      <Card className="overflow-hidden border p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Colonne gauche : Nom et ID */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="p-1.5 rounded bg-primary/10">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate text-sm">{entreprise.name}</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs text-muted-foreground truncate cursor-help">
                    ID: {entreprise.id}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-mono text-xs">{entreprise.id}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Colonne centrale : Informations */}
          <div className="flex items-center gap-3 text-xs">
            <Tooltip>
              <TooltipTrigger className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                <span>{entreprise.lang.toUpperCase()}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Langue</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{users.length}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Utilisateurs</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Colonne droite : Dates et statut */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {new Date(entreprise.createdAt).toLocaleDateString(
                      "fr-FR",
                      {
                        day: "2-digit",
                        month: "2-digit",
                      }
                    )}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Créée le{" "}
                    {new Date(entreprise.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {new Date(entreprise.updatedAt).toLocaleDateString(
                      "fr-FR",
                      {
                        day: "2-digit",
                        month: "2-digit",
                      }
                    )}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Modifiée le{" "}
                    {new Date(entreprise.updatedAt).toLocaleDateString("fr-FR")}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>

            <Badge
              variant={entreprise.active ? "default" : "secondary"}
              className="text-xs px-2 py-0.5"
            >
              {entreprise.active ? (
                <CheckCircle className="mr-1 h-2.5 w-2.5" />
              ) : (
                <XCircle className="mr-1 h-2.5 w-2.5" />
              )}
              {entreprise.active ? "Actif" : "Inactif"}
            </Badge>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
};

export default EntreprisePageInfo;
