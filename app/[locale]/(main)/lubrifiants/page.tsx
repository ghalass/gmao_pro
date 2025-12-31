// app/[locale]/(main)/lubrifiants/page.tsx
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
import { Droplet, Calendar, Landmark } from "lucide-react";
import NewLubrifiant from "./_components/new-lubrifiant";
import FormError from "@/components/form/FormError";
import LubrifiantRowActions from "./_components/lubrifiant-row-actions";
import { getJoinedDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { getScopedI18n } from "@/locales/server";

const LubrifiantsPage = async () => {
  const lubrifiantsResponse = await apiFetch(API.LUBRIFIANTS.ALL);
  const typelubrifiantsResponse = await apiFetch(API.TYPELUBRIFIANTS.ALL);
  const parcsResponse = await apiFetch(API.PARCS.ALL);
  const t = await getScopedI18n("pages.lubrifiants");

  if (!lubrifiantsResponse.ok) {
    return <FormError error={lubrifiantsResponse.data.message} />;
  }

  const lubrifiants = lubrifiantsResponse.data || [];
  const typelubrifiants = typelubrifiantsResponse.ok
    ? typelubrifiantsResponse.data
    : [];
  const parcs = parcsResponse.ok ? parcsResponse.data : [];
  const plural = lubrifiants.length !== 1 ? "s" : "";

  return (
    <div className="mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {lubrifiants.length} lubrifiant{plural} configuré{plural}
          </p>
        </div>
        <div>
          <NewLubrifiant typelubrifiants={typelubrifiants} parcs={parcs} />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.name")}</TableHead>
              <TableHead>{t("table.type")}</TableHead>
              <TableHead>{t("table.associatedParcs")}</TableHead>
              <TableHead>{t("table.creationDate")}</TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lubrifiants.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground italic"
                >
                  {t("table.noLubrifiants")}
                </TableCell>
              </TableRow>
            ) : (
              lubrifiants.map((lubrifiant: any) => (
                <TableRow key={lubrifiant.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Droplet className="h-4 w-4 text-primary" />
                      {lubrifiant.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {lubrifiant.typelubrifiant?.name || t("table.notDefined")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {lubrifiant.lubrifiantParc?.length > 0 ? (
                        lubrifiant.lubrifiantParc.map((lp: any) => (
                          <Badge
                            key={lp.parc.id}
                            variant="outline"
                            className="text-[10px] px-1 py-0"
                          >
                            <Landmark className="h-3 w-3 mr-1" />
                            {lp.parc.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          {t("table.noParc")}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {getJoinedDate(lubrifiant.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell className="w-0 text-right">
                    <LubrifiantRowActions
                      lubrifiant={lubrifiant}
                      typelubrifiants={typelubrifiants}
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

export default LubrifiantsPage;
