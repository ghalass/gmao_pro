// app/[locale]/(main)/typeorganes/page.tsx
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
import { Settings, Calendar, Package } from "lucide-react";
import NewTypeorgane from "./_components/new-typeorgane";
import FormError from "@/components/form/FormError";
import TypeorganeRowActions from "./_components/typeorgane-row-actions";
import { getScopedI18n } from "@/locales/server";

const TypeorganesPage = async () => {
  const typeorganesResponse = await apiFetch(API.TYPEORGANES.ALL);
  const t = await getScopedI18n("pages.typeorganes");

  if (!typeorganesResponse.ok) {
    return <FormError error={typeorganesResponse.data.message} />;
  }

  const typeorganes = typeorganesResponse.data || [];
  const plural = typeorganes.length !== 1 ? "s" : "";

  return (
    <div className="mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {typeorganes.length} type{plural} configuré{plural}
          </p>
        </div>
        <div>
          <NewTypeorgane />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.name")}</TableHead>
              <TableHead>{t("table.associatedParcs")}</TableHead>
              <TableHead>{t("table.associatedOrganes")}</TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {typeorganes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground italic"
                >
                  {t("table.noTypes")}
                </TableCell>
              </TableRow>
            ) : (
              typeorganes.map((typeorgane: any) => {
                const parcCount = typeorgane.parcs?.length || 0;
                const organeCount = typeorgane._count?.organes || 0;
                const pluralParc = parcCount !== 1 ? "s" : "";
                const pluralOrgane = organeCount !== 1 ? "s" : "";
                return (
                  <TableRow key={typeorgane.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-primary" />
                        {typeorgane.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span>
                          {parcCount > 0
                            ? `${parcCount} ${t("table.parcs")}`
                            : t("table.noParc")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Settings className="h-4 w-4" />
                        <span>
                          {organeCount > 0
                            ? `${organeCount} ${t("table.organes")}`
                            : t("table.noOrgane")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="w-0 text-right">
                      <TypeorganeRowActions typeorgane={typeorgane} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default TypeorganesPage;
