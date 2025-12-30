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
import { Landmark, Truck } from "lucide-react";
import NewParc from "./_components/new-parc";
import FormError from "@/components/form/FormError";
import ParcRowActions from "./_components/parc-row-actions";
import { Badge } from "@/components/ui/badge";

const ParcsPage = async () => {
  const parcsResponse = await apiFetch(API.PARCS.ALL);
  const typeparcsResponse = await apiFetch(API.TYPEPARCS.ALL);
  const pannesResponse = await apiFetch(API.PANNES.ALL);

  if (!parcsResponse.ok) {
    return <FormError error={parcsResponse.data?.message} />;
  }

  const parcs = parcsResponse.data || [];
  const typeparcs = typeparcsResponse.ok ? typeparcsResponse.data : [];
  const pannes = pannesResponse.ok ? pannesResponse.data : [];

  return (
    <div className="mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Parcs</h1>
          <p className="text-sm text-muted-foreground">
            {parcs.length} parc{parcs.length !== 1 ? "s" : ""} configuré
            {parcs.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div>
          <NewParc typeparcs={typeparcs} pannes={pannes} />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom du Parc</TableHead>
              <TableHead>Type de Parc</TableHead>
              <TableHead>Pannes possibles</TableHead>
              <TableHead>Engins rattachés</TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parcs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground italic"
                >
                  Aucun parc configuré
                </TableCell>
              </TableRow>
            ) : (
              parcs.map((parc: any) => (
                <TableRow key={parc.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-primary" />
                      {parc.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {parc.typeparc?.name || "Non défini"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {parc.pannes?.length > 0 ? (
                        parc.pannes.map((p: any) => (
                          <Badge
                            key={p.id}
                            variant="outline"
                            className="text-[10px] px-1 py-0"
                          >
                            {p.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Aucune panne
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Truck className="h-4 w-4" />
                      <span>{parc._count?.engins || 0} engins</span>
                    </div>
                  </TableCell>
                  <TableCell className="w-0 text-right">
                    <ParcRowActions
                      parc={parc}
                      typeparcs={typeparcs}
                      pannes={pannes}
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

export default ParcsPage;
