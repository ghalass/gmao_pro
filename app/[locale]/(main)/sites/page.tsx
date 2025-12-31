// app/[locale]/(main)/sites/page.tsx
import { API, apiFetch } from "@/lib/api";
import FormError from "@/components/form/FormError";
import { getScopedI18n } from "@/locales/server";
import SitesClientPage from "./_components/sites-client-page";

const SitesPage = async () => {
  const sitesResponse = await apiFetch(API.SITES.ALL);
  const t = await getScopedI18n("pages.sites");

  if (!sitesResponse.ok) {
    return <FormError error={sitesResponse.data.message} />;
  }

  const sites = sitesResponse.data || [];
  const plural = sites.length !== 1 ? "s" : "";

  return (
    <SitesClientPage
      initialSites={sites}
      translations={{
        title: t("title"),
        table: {
          name: t("table.name"),
          status: t("table.status"),
          attachedEngins: t("table.attachedEngins"),
          active: t("table.active"),
          inactive: t("table.inactive"),
          engins: t("table.engins"),
          noSites: t("table.noSites"),
        },
        import: {
          title: "Importation de Sites",
          description: "Importez des sites en masse depuis un fichier Excel",
          backButton: "Retour à la liste",
          refreshButton: "Actualiser",
          importButton: "Importer Excel",
          newSiteButton: "Nouveau Site",
        },
      }}
    />
  );
};

export default SitesPage;
