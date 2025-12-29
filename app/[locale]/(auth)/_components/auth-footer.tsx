// app/[locale]/_components/auth-footer.tsx
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ROUTE } from "@/lib/routes";
import { useScopedI18n } from "@/locales/client";
import Link from "next/link";

interface AuthFooterProps {
  formName: string;
  goToRoute: string;
  isSubmitting: boolean;
  onReset: () => void; // Ajoutez cette prop
  page: "login" | "register";
}

const AuthFooter = ({
  formName,
  goToRoute,
  isSubmitting,
  onReset, // Recevez la fonction de reset
  page,
}: AuthFooterProps) => {
  const tans =
    page === "login"
      ? useScopedI18n("pages.login")
      : useScopedI18n("pages.register");

  return (
    <CardFooter className="flex flex-col gap-4">
      <div className="flex flex-row sm:flex-row gap-2 w-full">
        <Button
          type="submit"
          form={formName}
          disabled={isSubmitting}
          className="flex-1"
          size="sm"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner className="h-4 w-4" />
              {tans("footer.submitButton.processingText")}
            </span>
          ) : (
            tans("footer.submitButton.text")
          )}
        </Button>
        <Button
          disabled={isSubmitting}
          type="button"
          variant="outline"
          onClick={onReset} // Utilisez la fonction passée en props
          size="sm"
        >
          {tans("footer.resetButtonText")}
        </Button>
      </div>

      <div className="text-center space-y-2 text-sm">
        <p className="text-muted-foreground">
          {tans("footer.question.text")}{" "}
          <Link
            href={goToRoute}
            className="text-primary hover:underline font-medium"
          >
            {tans("footer.question.linkText")}
          </Link>
        </p>
        <p className="text-muted-foreground">
          <Link
            href={ROUTE.MAIN}
            className="text-primary hover:underline font-medium"
          >
            {tans("footer.linkText")}
          </Link>
        </p>
      </div>
    </CardFooter>
  );
};

export default AuthFooter;
