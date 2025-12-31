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
import { getScopedI18n } from "@/locales/server";

const TypeparcsPage = async () => {
  const typeparcsResponse = await apiFetch(API.TYPEPARCS.ALL);
  const t = await getScopedI18n("pages.typeparcs");

  if (!typeparcsResponse.ok) {
    return <FormError error={typeparcsResponse.data.message} />;
  }

  const typeparcs = typeparcsResponse.data || [];
  const plural = typeparcs.length !== 1 ? "s" : "";

  return (
    <div className="mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {typeparcs.length} type{plural} configuré{plural}
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
              <TableHead>{t("table.name")}</TableHead>
              <TableHead>{t("table.associatedParcs")}</TableHead>
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
                  {t("table.noTypes")}
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
                      <span>{typeparc._count?.parcs || 0} {t("table.parcs")}</span>
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
