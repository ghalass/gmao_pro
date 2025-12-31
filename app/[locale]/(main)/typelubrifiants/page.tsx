// app/[locale]/(main)/typelubrifiants/page.tsx
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
import { Droplet, Calendar } from "lucide-react";
import NewTypelubrifiant from "./_components/new-typelubrifiant";
import FormError from "@/components/form/FormError";
import TypelubrifiantRowActions from "./_components/typelubrifiant-row-actions";
import { getJoinedDate } from "@/lib/utils";
import { getScopedI18n } from "@/locales/server";

const TypelubrifiantsPage = async () => {
  const typelubrifiantsResponse = await apiFetch(API.TYPELUBRIFIANTS.ALL);
  const t = await getScopedI18n("pages.typelubrifiants");

  if (!typelubrifiantsResponse.ok) {
    return <FormError error={typelubrifiantsResponse.data.message} />;
  }

  const typelubrifiants = typelubrifiantsResponse.data || [];
  const plural = typelubrifiants.length !== 1 ? "s" : "";

  return (
    <div className="mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {typelubrifiants.length} type{plural} configuré{plural}
          </p>
        </div>
        <div>
          <NewTypelubrifiant />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.name")}</TableHead>
              <TableHead>{t("table.associatedLubrifiants")}</TableHead>
              <TableHead>{t("table.creationDate")}</TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {typelubrifiants.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground italic"
                >
                  {t("table.noTypes")}
                </TableCell>
              </TableRow>
            ) : (
              typelubrifiants.map((typelubrifiant: any) => {
                const count = typelubrifiant.lubrifiants?.length || 0;
                const pluralLub = count !== 1 ? "s" : "";
                return (
                  <TableRow key={typelubrifiant.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Droplet className="h-4 w-4 text-primary" />
                        {typelubrifiant.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Droplet className="h-4 w-4" />
                        <span>
                          {count} lubrifiant{pluralLub}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {getJoinedDate(typelubrifiant.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="w-0 text-right">
                      <TypelubrifiantRowActions typelubrifiant={typelubrifiant} />
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

export default TypelubrifiantsPage;
