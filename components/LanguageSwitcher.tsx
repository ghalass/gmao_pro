"use client";

// import { useParams, usePathname, useRouter } from "next/navigation";
import { Languages } from "@/locales/langs";
import { Button } from "./ui/button";
import { useChangeLocale, useCurrentLocale } from "@/locales/client";
import { CIcon } from "@coreui/icons-react";
import { cifFr, cifSa } from "@coreui/icons";

const LanguageSwitcher = () => {
  const changeLocale = useChangeLocale();
  const locale = useCurrentLocale();

  return (
    <div className="">
      {locale === Languages.FRENCH ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => changeLocale(Languages.ARABE)}
        >
          العربية
          <CIcon icon={cifSa} size="sm" />
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => changeLocale(Languages.FRENCH)}
        >
          Français <CIcon icon={cifFr} size="sm" />
        </Button>
      )}
    </div>
  );
};

export default LanguageSwitcher;
