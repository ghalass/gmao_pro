import NewSaisiehrm from "./_components/new-saisiehrm";
import HrmList from "./_components/hrm-list";
import { getScopedI18n } from "@/locales/server";

const SaisiehrmsPage = async () => {
  const t = await getScopedI18n("pages.saisiehrms");

  return (
    <div className="mx-auto p-4 max-w-[1400px]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div>
          <NewSaisiehrm />
        </div>
      </div>

      <HrmList />
    </div>
  );
};

export default SaisiehrmsPage;
