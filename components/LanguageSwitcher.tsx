"use client";

// import { useParams, usePathname, useRouter } from "next/navigation";
import { Languages } from "@/locales/langs";
import { Button } from "./ui/button";
import { useChangeLocale, useCurrentLocale } from "@/locales/client";

const LanguageSwitcher = () => {

  const changeLocale = useChangeLocale()
  const locale = useCurrentLocale()

  return (
    <div className="">

      {locale === Languages.FRENCH ? (
        <Button size="sm"
          variant="outline"
          onClick={() => changeLocale(Languages.ARABE)}
        >
          العربية
        </Button>
      ) : (
        <Button size="sm"
          variant="outline"
          onClick={() => changeLocale(Languages.FRENCH)}
        >
          Français
        </Button>
      )}
    </div>
  );
};

export default LanguageSwitcher;
