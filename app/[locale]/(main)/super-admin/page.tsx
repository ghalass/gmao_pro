import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
// import React from "react";

// const SuperAdminPage = async () => {
//   const session = await getSession();

//   if (!session?.isSuperAdmin) {
//     redirect("/");
//   }

//   return <div>SuperAdminPage</div>;
// };

// export default SuperAdminPage;

import { API, apiFetch } from "@/lib/api";
import { ROUTE } from "@/lib/routes";
import { getJoinedDate } from "@/lib/utils";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Globe,
  Calendar,
  Clock,
  ChevronRight,
  Users,
} from "lucide-react";

const EntreprisesPage = async () => {
  type entreprise = {
    id: string;
    name: string;
    lang: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    users: [];
  };

  const entreprises = await apiFetch(API.ENTREPRISES.ALL);

  if (!entreprises.ok) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">
              Erreur lors du chargement des entreprises
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const entreprisesData: entreprise[] = entreprises.data || [];

  const session = await getSession();
  if (!session?.isSuperAdmin) {
    redirect("/");
  }

  return (
    <div className="bg-background">
      <div className="container mx-auto p-2 md:p-3 lg:p-4">
        {/* En-tête adapté */}
        <header className="mb-4">
          <h1 className="text-3xl font-bold mb-2">Liste des entreprises</h1>
          <p className="text-muted-foreground">
            {entreprisesData.length.toLocaleString()} entreprises chargés avec
            succès
          </p>
        </header>

        {/* Vérification si des données existent */}
        {entreprisesData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              Aucune donnée disponible
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
            {entreprisesData.map((item, index) => (
              <div
                key={index}
                className="group p-4 border rounded-lg bg-card hover:shadow-md transition-all duration-200 hover:border-primary/20 hover:cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  {/* Cercle avec numéro */}
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <span className="text-primary font-bold">{index + 1}</span>
                  </div>

                  {/* Contenu principal */}
                  <div className="flex-1 min-w-0">
                    {/* Titre avec lien */}
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-base truncate group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>
                      <Badge
                        variant={item.active ? "default" : "secondary"}
                        className={
                          item.active
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "text-destructive"
                        }
                      >
                        {item.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    {/* Métadonnées */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {/* Date de création */}
                      <div className="flex items-center gap-1">
                        <span className="opacity-70">📅</span>
                        <span>Créée le : {getJoinedDate(item.createdAt)}</span>
                      </div>

                      {/* Langue */}
                      <div className="flex items-center gap-1">
                        <span className="opacity-70">🌐</span>
                        <span className="font-medium">
                          Langue : {item.lang.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Diviseur optionnel */}
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Dernière mise à jour:
                    </span>
                    <span className="font-medium">
                      {getJoinedDate(item.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EntreprisesPage;
