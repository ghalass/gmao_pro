// app/[locale]/not-found.tsx
import { NotFoundPage } from "@/components/NotFoundPage";
import { getScopedI18n } from "@/locales/server";
import { Navigation } from "lucide-react";

export default async function NotFound() {
  const notFoundPage = await getScopedI18n("pages.notFoundPage");

  return (
    <NotFoundPage
      title={notFoundPage("title")}
      message={notFoundPage("message")}
      buttonText={notFoundPage("buttonText")}
      buttonHref="/"
      info={notFoundPage("info")}
      icon={Navigation}
      iconClassName="text-primary"
      iconBgClassName="bg-primary/10"
      className="min-h-screen p-4"
      cardClassName="border-0"
    />
  );
}
