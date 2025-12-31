// app/[locale]/(main)/sites/page.tsx
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
import { MapPin, Truck } from "lucide-react";
import NewSite from "./_components/new-site";
import FormError from "@/components/form/FormError";
import SiteRowActions from "./_components/site-row-actions";
import { getScopedI18n } from "@/locales/server";

const SitesPage = async () => {
  const sitesResponse = await apiFetch(API.SITES.ALL);
  const t = await getScopedI18n("pages.sites");

  if (!sitesResponse.ok) {
    return <FormError error={sitesResponse.data.message} />;
  }

  const sites = sitesResponse.data || [];
  const plural = sites.length !== 1 ? "s" : "";

  return (
    <div className="mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {sites.length} site{plural} configuré{plural}
          </p>
        </div>
        <div>
          <NewSite />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.name")}</TableHead>
              <TableHead>{t("table.status")}</TableHead>
              <TableHead>{t("table.attachedEngins")}</TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sites.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground italic"
                >
                  {t("table.noSites")}
                </TableCell>
              </TableRow>
            ) : (
              sites.map((site: any) => (
                <TableRow key={site.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      {site.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={site.active ? "success" : "secondary"}>
                      {site.active ? t("table.active") : t("table.inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Truck className="h-4 w-4" />
                      <span>
                        {site._count?.engins || 0} {t("table.engins")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="w-0 text-right">
                    <SiteRowActions site={site} />
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

export default SitesPage;
