// app/[locale]/(main)/objectifs/page.tsx
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
import { Calendar, Target, Building2, Landmark } from "lucide-react";
import NewObjectif from "./_components/new-objectif";
import FormError from "@/components/form/FormError";
import ObjectifRowActions from "./_components/objectif-row-actions";
import { getScopedI18n } from "@/locales/server";

type ObjectifWithRelations = {
  id: string;
  annee: number;
  parcId: string;
  siteId: string;
  dispo: number | null;
  mtbf: number | null;
  tdm: number | null;
  spe_huile: number | null;
  spe_go: number | null;
  spe_graisse: number | null;
  createdAt: Date;
  updatedAt: Date;
  parc: {
    id: string;
    name: string;
    typeparc?: {
      id: string;
      name: string;
    } | null;
  };
  site: {
    id: string;
    name: string;
  };
};

const ObjectifsPage = async () => {
  const objectifsResponse = await apiFetch(API.OBJECTIFS.ALL);
  const parcsResponse = await apiFetch(API.PARCS.ALL);
  const sitesResponse = await apiFetch(API.SITES.ALL);
  const typeparcsResponse = await apiFetch(API.TYPEPARCS.ALL);
  const t = await getScopedI18n("pages.objectifs");

  if (!objectifsResponse.ok) {
    return <FormError error={objectifsResponse.data?.message} />;
  }

  const objectifs = objectifsResponse.data || [];
  const parcs = parcsResponse.ok ? parcsResponse.data : [];
  const sites = sitesResponse.ok ? sitesResponse.data : [];
  const typeparcs = typeparcsResponse.ok ? typeparcsResponse.data : [];
  const plural = objectifs.length !== 1 ? "s" : "";

  return (
    <div className="mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {objectifs.length} objectif{plural}
          </p>
        </div>
        <div>
          <NewObjectif parcs={parcs} sites={sites} typeparcs={typeparcs} />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.year")}</TableHead>
              <TableHead>{t("table.parc")}</TableHead>
              <TableHead>{t("table.site")}</TableHead>
              <TableHead>{t("table.dispo")}</TableHead>
              <TableHead>{t("table.mtbf")}</TableHead>
              <TableHead>{t("table.tdm")}</TableHead>
              <TableHead>{t("table.specifications")}</TableHead>
              <TableHead className="w-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {objectifs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  {t("table.noObjectifs")}
                </TableCell>
              </TableRow>
            ) : (
              objectifs?.map((objectif: ObjectifWithRelations) => {
                return (
                  <TableRow key={objectif.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {objectif.annee}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Landmark className="h-4 w-4 text-primary" />
                        <div className="flex flex-col">
                          <span>{objectif.parc.name}</span>
                          {objectif.parc.typeparc && (
                            <Badge variant="outline" className="w-fit text-xs mt-1">
                              {objectif.parc.typeparc.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {objectif.site.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {objectif.dispo !== null ? (
                        <span className="font-medium">{objectif.dispo}%</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {objectif.mtbf !== null ? (
                        <span className="font-medium">{objectif.mtbf}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {objectif.tdm !== null ? (
                        <span className="font-medium">{objectif.tdm}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs">
                        {objectif.spe_huile !== null && (
                          <div>
                            <span className="text-muted-foreground">{t("table.oil")}: </span>
                            <span className="font-medium">{objectif.spe_huile}</span>
                          </div>
                        )}
                        {objectif.spe_go !== null && (
                          <div>
                            <span className="text-muted-foreground">{t("table.go")}: </span>
                            <span className="font-medium">{objectif.spe_go}</span>
                          </div>
                        )}
                        {objectif.spe_graisse !== null && (
                          <div>
                            <span className="text-muted-foreground">{t("table.grease")}: </span>
                            <span className="font-medium">{objectif.spe_graisse}</span>
                          </div>
                        )}
                        {objectif.spe_huile === null &&
                          objectif.spe_go === null &&
                          objectif.spe_graisse === null && (
                            <span className="text-muted-foreground">-</span>
                          )}
                      </div>
                    </TableCell>
                    <TableCell className="w-0 text-right">
                      <ObjectifRowActions
                        objectif={objectif}
                        parcs={parcs}
                        sites={sites}
                        typeparcs={typeparcs}
                      />
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

export default ObjectifsPage;

