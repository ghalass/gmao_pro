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
import { Wrench, ListTree } from "lucide-react";
import NewPanne from "./_components/new-panne";
import FormError from "@/components/form/FormError";
import PanneRowActions from "./_components/panne-row-actions";
import { Badge } from "@/components/ui/badge";

const PannesPage = async () => {
  const pannesResponse = await apiFetch(API.PANNES.ALL);
  const typepannesResponse = await apiFetch(API.TYPEPANNES.ALL);
  const parcsResponse = await apiFetch(API.PARCS.ALL);

  if (!pannesResponse.ok) {
    return <FormError error={pannesResponse.data?.message} />;
  }

  const pannes = pannesResponse.data || [];
  const typepannes = typepannesResponse.ok ? typepannesResponse.data : [];
  const parcs = parcsResponse.ok ? parcsResponse.data : [];

  return (
    <div className="mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Pannes</h1>
          <p className="text-sm text-muted-foreground">
            {pannes.length} panne{pannes.length !== 1 ? "s" : ""} référencée
            {pannes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div>
          <NewPanne typepannes={typepannes} parcs={parcs} />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom de la Panne</TableHead>
              <TableHead>Type de Panne</TableHead>
              <TableHead>Parcs associés</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Saisies liées</TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pannes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground italic"
                >
                  Aucune panne configurée
                </TableCell>
              </TableRow>
            ) : (
              pannes.map((panne: any) => (
                <TableRow key={panne.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-primary" />
                      {panne.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {panne.typepanne?.name || "Non défini"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {panne.parcs?.length > 0 ? (
                        panne.parcs.map((p: any) => (
                          <Badge
                            key={p.id}
                            variant="secondary"
                            className="text-[10px] px-1 py-0"
                          >
                            {p.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-destructive italic">
                          Aucun parc associé
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {panne.description || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <ListTree className="h-4 w-4" />
                      <span>{panne._count?.saisiehim || 0} saisies</span>
                    </div>
                  </TableCell>
                  <TableCell className="w-0 text-right">
                    <PanneRowActions
                      panne={panne}
                      typepannes={typepannes}
                      parcs={parcs}
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

export default PannesPage;
