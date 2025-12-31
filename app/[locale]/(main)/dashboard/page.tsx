import { getScopedI18n } from "@/locales/server";

const DashboardPage = async () => {
  const t = await getScopedI18n("pages.dashboard");
  
  return (
    <div>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
    </div>
  );
};

export default DashboardPage;