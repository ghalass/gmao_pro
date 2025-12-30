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
import { ListOrdered, Wrench } from "lucide-react";
import NewTypepanne from "./_components/new-typepanne";
import FormError from "@/components/form/FormError";
import TypepanneRowActions from "./_components/typepanne-row-actions";

const TypepannesPage = async () => {
  const typepannesResponse = await apiFetch(API.TYPEPANNES.ALL);

  if (!typepannesResponse.ok) {
    return <FormError error={typepannesResponse.data.message} />;
  }

  const typepannes = typepannesResponse.data || [];

  return (
    <div className="mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Types de Panne</h1>
          <p className="text-sm text-muted-foreground">
            {typepannes.length} type{typepannes.length !== 1 ? "s" : ""}{" "}
            configuré{typepannes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div>
          <NewTypepanne />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom du Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Pannes associées</TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {typepannes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground italic"
                >
                  Aucun type de panne configuré
                </TableCell>
              </TableRow>
            ) : (
              typepannes.map((typepanne: any) => (
                <TableRow key={typepanne.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <ListOrdered className="h-4 w-4 text-primary" />
                      {typepanne.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {typepanne.description || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Wrench className="h-4 w-4" />
                      <span>{typepanne._count?.pannes || 0} pannes</span>
                    </div>
                  </TableCell>
                  <TableCell className="w-0 text-right">
                    <TypepanneRowActions typepanne={typepanne} />
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

export default TypepannesPage;
