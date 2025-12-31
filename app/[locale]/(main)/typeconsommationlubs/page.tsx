// app/[locale]/(main)/typeconsommationlubs/page.tsx
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
import { Badge } from "@/components/ui/badge";
import { Calendar, Package } from "lucide-react";
import { getJoinedDate } from "@/lib/utils";
import { Typeconsommationlub } from "@/lib/generated/prisma/client";
import NewTypeconsommationlub from "./_components/new-typeconsommationlub";
import FormError from "@/components/form/FormError";
import TypeconsommationlubRowActions from "./_components/typeconsommationlub-row-actions";
import { getScopedI18n } from "@/locales/server";

type TypeconsommationlubWithRelations = Typeconsommationlub & {
  parcs: {
    parc: {
      id: string;
      name: string;
      typeparc?: {
        id: string;
        name: string;
      } | null;
    };
  }[];
  _count: {
    saisielubrifiant: number;
  };
};

const TypeconsommationlubsPage = async () => {
  const typeconsommationlubsResponse = await apiFetch(
    API.TYPECONSOMMATIONLUBS.ALL
  );

  if (!typeconsommationlubsResponse.ok) {
    return <FormError error={typeconsommationlubsResponse.data.message} />;
  }

  const typeconsommationlubs = (typeconsommationlubsResponse.data ||
    []) as TypeconsommationlubWithRelations[];
  const plural = typeconsommationlubs.length !== 1 ? "s" : "";

  return (
    <div className="mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Types de consommation de lubrifiants
          </h1>
          <p className="text-sm text-muted-foreground">
            {typeconsommationlubs.length} type{plural} de consommation
          </p>
        </div>
        <div>
          <NewTypeconsommationlub />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Parcs associés</TableHead>
              <TableHead>Utilisations</TableHead>
              <TableHead>Date de création</TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {typeconsommationlubs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Aucun type de consommation enregistré
                </TableCell>
              </TableRow>
            ) : (
              typeconsommationlubs?.map(
                (typeconsommationlub: TypeconsommationlubWithRelations) => {
                  return (
                    <TableRow key={typeconsommationlub.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          {typeconsommationlub.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {typeconsommationlub.parcs &&
                        typeconsommationlub.parcs.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {typeconsommationlub.parcs.map((p, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs"
                              >
                                {p.parc.name}
                                {p.parc.typeparc &&
                                  ` (${p.parc.typeparc.name})`}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Aucun parc associé
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {typeconsommationlub._count.saisielubrifiant}{" "}
                          utilisation
                          {typeconsommationlub._count.saisielubrifiant !== 1
                            ? "s"
                            : ""}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {getJoinedDate(typeconsommationlub.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="w-0 text-right">
                        <TypeconsommationlubRowActions
                          typeconsommationlub={typeconsommationlub}
                        />
                      </TableCell>
                    </TableRow>
                  );
                }
              )
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default TypeconsommationlubsPage;
