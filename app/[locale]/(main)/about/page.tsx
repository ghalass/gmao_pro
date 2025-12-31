import { getScopedI18n } from "@/locales/server";

const AboutPage = async () => {
  const t = await getScopedI18n("pages.about");
  
  return (
    <div>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
    </div>
  );
};

export default AboutPage;