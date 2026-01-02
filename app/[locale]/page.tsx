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
          <div className="max-w-md mx-auto space-y-6">
            <div className="bg-card border rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {session?.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
              </div>

              <div className="text-center space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {homePage("ifConnected.welcome")}
                  </p>
                  <p className="text-xl font-semibold text-foreground">
                    {session?.name} - {session.entrepriseName}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-2">Rôles</p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {session?.roles?.map((role, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link href={ROUTE.DASHBOARD}>
                <Button size="lg" className="w-full">
                  <Play className="mr-2 h-4 w-4" />
                  {homePage("ifConnected.buttonTitle")}
                </Button>
              </Link>

              <div className="flex justify-center">
                <LogoutButton />
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="max-w-md mx-auto space-y-6">
            <div className="bg-card border rounded-lg p-6 shadow-sm text-center">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">
                  {homePage("question1.title")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {homePage("question1.subTitle")}
                </p>
              </div>
              <div className="mt-6">
                <Link href={ROUTE.AUTH.REGISTER}>
                  <Button size="lg" className="w-full">
                    <Play className="mr-2 h-4 w-4" />
                    {homePage("question1.buttonTitle")}
                  </Button>
                </Link>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6 shadow-sm text-center">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">
                  {homePage("question2.title")}
                </h2>
              </div>
              <div className="mt-6">
                <Link href={ROUTE.AUTH.LOGIN}>
                  <Button
                    variant="outline"
                    className="w-full border-primary/20 hover:border-primary/30 hover:bg-primary/5"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    {homePage("question2.buttonTitle")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* SUPER ADMIN CHECK */}
      {session?.isSuperAdmin && (
        <div className="max-w-md mx-auto">
          <Link href={ROUTE.ENTREPRISES.ALL}>
            <Button
              variant="outline"
              className="w-full border-primary/20 hover:border-primary/30 hover:bg-primary/5"
            >
              <Play className="mr-2 h-4 w-4" />
              {"Gestion des entreprises"}
            </Button>
          </Link>
        </div>
      )}

      {/* <DisplayData data={session} /> */}
    </div>
  );
}
