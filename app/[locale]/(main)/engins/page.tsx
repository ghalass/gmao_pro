import { API, apiFetch } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Tractor, MapPin, Landmark, Clock } from "lucide-react";
import NewEngin from "./_components/new-engin";
import FormError from "@/components/form/FormError";
import EnginRowActions from "./_components/engin-row-actions";
import { Badge } from "@/components/ui/badge";

const EnginsPage = async () => {
  const enginsResponse = await apiFetch(API.ENGINS.ALL);
  const parcsResponse = await apiFetch(API.PARCS.ALL);
  const sitesResponse = await apiFetch(API.SITES.ALL);

  if (!enginsResponse.ok) {
    return <FormError error={enginsResponse.data?.message} />;
  }

  const engins = enginsResponse.data || [];
  const parcs = parcsResponse.ok ? parcsResponse.data : [];
  const sites = sitesResponse.ok ? sitesResponse.data : [];

  return (
    <div className="mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Engins</h1>
          <p className="text-sm text-muted-foreground">
            {engins.length} engin{engins.length !== 1 ? "s" : ""} répertorié
            {engins.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div>
          <NewEngin parcs={parcs} sites={sites} />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom / Code</TableHead>
              <TableHead>Parc</TableHead>
              <TableHead>Site Actuel</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Heures Initiales</TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {engins.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground italic"
                >
                  Aucun engin configuré
                </TableCell>
              </TableRow>
            ) : (
              engins.map((engin: any) => (
                <TableRow key={engin.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Tractor className="h-4 w-4 text-primary" />
                      {engin.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">
                        {engin.parc?.name || "Sans parc"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">
                        {engin.site?.name || "Sans site"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={engin.active ? "success" : "secondary"}>
                      {engin.active ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-sm font-mono">
                        {engin.initialHeureChassis || 0} h
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="w-0 text-right">
                    <EnginRowActions
                      engin={engin}
                      parcs={parcs}
                      sites={sites}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default EnginsPage;
