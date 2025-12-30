// app/[locale]/(main)/typeparcs/page.tsx
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
import { Tractor, Car } from "lucide-react";
import NewTypeparc from "./_components/new-typeparc";
import FormError from "@/components/form/FormError";
import TypeparcRowActions from "./_components/typeparc-row-actions";

const TypeparcsPage = async () => {
  const typeparcsResponse = await apiFetch(API.TYPEPARCS.ALL);

  if (!typeparcsResponse.ok) {
    return <FormError error={typeparcsResponse.data.message} />;
  }

  const typeparcs = typeparcsResponse.data || [];

  return (
    <div className="mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Types de Parc</h1>
          <p className="text-sm text-muted-foreground">
            {typeparcs.length} type{typeparcs.length !== 1 ? "s" : ""} configuré
            {typeparcs.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div>
          <NewTypeparc />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom du Type</TableHead>
              <TableHead>Parcs associés</TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {typeparcs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="h-24 text-center text-muted-foreground italic"
                >
                  Aucun type de parc configuré
                </TableCell>
              </TableRow>
            ) : (
              typeparcs.map((typeparc: any) => (
                <TableRow key={typeparc.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Tractor className="h-4 w-4 text-primary" />
                      {typeparc.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Car className="h-4 w-4" />
                      <span>{typeparc._count?.parcs || 0} parcs</span>
                    </div>
                  </TableCell>
                  <TableCell className="w-0 text-right">
                    <TypeparcRowActions typeparc={typeparc} />
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

export default TypeparcsPage;
