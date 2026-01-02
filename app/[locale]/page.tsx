import DisplayData from "@/components/DisplayData";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LogoutButton from "@/components/LogoutButton";
import ModeToggle from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { ROUTE } from "@/lib/routes";
import { getScopedI18n } from "@/locales/server";
import { LogIn, Play } from "lucide-react";
import Link from "next/link";

export default async function RootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const session = await getSession();

  const homePage = await getScopedI18n("pages.home");
  return (
    <div className="min-h-screen flex flex-col gap-4 items-center justify-center p-4">
      <div className="flex gap-2 justify-between">
        <LanguageSwitcher />
        <ModeToggle />
      </div>
      <div className="text-center space-y-3 mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3">
          {homePage("welcome")}
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          {homePage("description")}
        </p>

        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          {homePage("sub_description")}
        </p>
      </div>

      {session?.isLoggedIn ? (
        <>
          <div className="text-center space-y-2">
            <p>
              {homePage("ifConnected.welcome")}, {session?.name}
            </p>
            <p>{session?.roles}</p>
            <Link href={ROUTE.DASHBOARD}>
              <Button size={"sm"} className="w-min">
                <Play />
                {homePage("ifConnected.buttonTitle")}
              </Button>
            </Link>
            <div className="flex justify-center mt-2 border rounded-full shadow-sm py-1">
              <LogoutButton />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="text-center space-y-2">
            <p>{homePage("question1.title")}</p>
            <p>{homePage("question1.subTitle")}</p>
            <Link href={ROUTE.AUTH.REGISTER}>
              <Button size={"sm"} className="w-min">
                <Play />
                {homePage("question1.buttonTitle")}
              </Button>
            </Link>
          </div>

          <div className="text-center space-y-3 my-8 md:my-12">
            <p>{homePage("question2.title")}</p>
            <Link href={ROUTE.AUTH.LOGIN}>
              <Button size={"sm"} className="w-min">
                <LogIn />
                {homePage("question2.buttonTitle")}
              </Button>
            </Link>
          </div>
        </>
      )}

      {/* SUPER ADMIN CHECK */}
      {session?.isSuperAdmin && (
        <Link href={ROUTE.SUPER_ADMIN.MAIN}>
          <Button size={"sm"} className="w-min">
            <Play />
            {"Gestion des entreprises"}
          </Button>
        </Link>
      )}

      <DisplayData data={session} />
    </div>
  );
}
