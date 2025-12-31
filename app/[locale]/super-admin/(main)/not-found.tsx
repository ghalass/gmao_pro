import { NotFoundPage } from "@/components/NotFoundPage";
import { getScopedI18n } from "@/locales/server";
import { AlertCircle } from "lucide-react";

export default async function NotFound() {
  const notFoundPage = await getScopedI18n("pages.notFoundPage");

  return (
    <NotFoundPage
      title={notFoundPage("title")}
      message={notFoundPage("message")}
      buttonText={notFoundPage("buttonText")}
      buttonHref="/super-admin"
      info={notFoundPage("info")}
      icon={AlertCircle}
    />
  );
}
