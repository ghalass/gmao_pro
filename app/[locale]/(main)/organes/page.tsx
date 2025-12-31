// app/organes/page.tsx - Fixed version with direct database query
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, Settings, Wrench, XCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import NewOrgane from "./_components/new-organe";
import OrganeRowActions from "./_components/organe-row-actions";

import {
  Organe,
  TypeOrgane,
  OrigineOrgane,
} from "@/lib/generated/prisma/client";

type OrganeWithTypeOrgane = Organe & {
  type_organe: TypeOrgane;
};

type SerializedOrgane = {
  id: string;
  name: string;
  marque: string | null;
  sn: string | null;
  active: boolean | null;
  entrepriseId: string;
  typeOrganeId: string;
  date_mes: Date | null;
  origine: OrigineOrgane | null;
  circuit: string | null;
  hrm_initial: number;
  obs: string | null;
  type_organe: TypeOrgane;
};

const OrganesPage = async () => {
  // Direct database query to bypass API timeout issues
  const { prisma } = await import("@/lib/prisma");
  const { getSession } = await import("@/lib/auth");

  try {
    console.log(" Page: Starting direct database query");
    const startTime = Date.now();

    const session = await getSession();
    if (!session.isLoggedIn) {
      return (
        <div className="mx-auto p-4">
          <h1 className="text-2xl font-bold text-red-600">Non authentifié</h1>
          <p>Veuillez vous connecter pour accéder à cette page.</p>
        </div>
      );
    }

    const organes = await prisma.organe.findMany({
      where: { entrepriseId: session.entrepriseId },
      include: {
        type_organe: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    // Convertir Decimal en number pour éviter les erreurs de sérialisation
    const serializedOrganes: SerializedOrgane[] = organes.map((organe) => ({
      ...organe,
      hrm_initial: organe.hrm_initial ? Number(organe.hrm_initial) : 0,
    }));

    const endTime = Date.now();
    console.log(
      ` Page: Query completed in ${endTime - startTime}ms, found ${
        organes.length
      } organes`
    );

    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gestion des Organes</h1>
            <p className="text-sm text-muted-foreground">
              {serializedOrganes.length} organe
              {serializedOrganes.length !== 1 ? "s" : ""} répertorié
              {serializedOrganes.length !== 1 ? "s" : ""}
            </p>
          </div>
          <NewOrgane />
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Nom</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Marque</TableHead>
                  <TableHead className="font-semibold">S/N</TableHead>
                  <TableHead className="font-semibold">Statut</TableHead>
                  <TableHead className="font-semibold">ID</TableHead>
                  <TableHead className="w-12 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Wrench className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          Aucun organe configuré
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Commencez par ajouter votre premier organe
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  serializedOrganes?.map((currentOrgane) => {
                    return (
                      <TableRow
                        key={currentOrgane.id}
                        className="hover:bg-muted/30"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10">
                                <Wrench className="h-4 w-4 text-primary" />
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {currentOrgane.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            <Settings className="mr-1 h-3 w-3" />
                            {currentOrgane.type_organe?.name || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {currentOrgane.marque || "-"}
                        </TableCell>
                        <TableCell className="text-sm font-mono">
                          {currentOrgane.sn || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {currentOrgane.active ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm">
                              {currentOrgane.active ? "Actif" : "Inactif"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-mono text-muted-foreground">
                              {currentOrgane.id
                                ? currentOrgane.id.slice(0, 8)
                                : "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <OrganeRowActions organe={currentOrgane as any} />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    );
  } catch (error) {
    console.error(" Page: Error:", error);
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-red-600">
              Erreur de chargement
            </h1>
            <p className="text-sm text-muted-foreground">
              Impossible de charger les organes.
            </p>
          </div>
        </div>

        <Card className="border-destructive/20">
          <div className="p-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-destructive font-medium mb-2">
                {error instanceof Error ? error.message : "Erreur inconnue"}
              </p>
              <p className="text-sm text-muted-foreground">
                Veuillez réessayer plus tard ou contacter l'administrateur.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }
};

export default OrganesPage;
