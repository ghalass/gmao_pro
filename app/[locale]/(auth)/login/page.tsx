// app/[locale]/login/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import ModeToggle from "@/components/ModeToggle";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useScopedI18n } from "@/locales/client";
import { useLoginForm } from "@/hooks/auth/useLoginForm";
import { FormField } from "@/components/form/FormField";
import { ROUTE } from "@/lib/routes";

export default function LoginPage() {
  const { form, error, setError, isSubmitting, validateField } = useLoginForm();
  const tans = useScopedI18n("pages.login");

  return (
    <div className="min-h-screen flex flex-col gap-4 items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <ModeToggle />
            <LanguageSwitcher />
          </div>

          <CardTitle className="text-2xl text-center">
            {tans("title")}
          </CardTitle>
          <CardDescription className="text-center">
            {tans("description")}
          </CardDescription>
          {error && (
            <div className="mt-2 p-3 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-sm text-destructive text-center">{error}</p>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <form
            id="login-form"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <FieldGroup className="gap-1">
              <FormField
                form={form}
                name="entrepriseName"
                label={tans("entrepriseName")}
                customValidator={(value) =>
                  validateField("entrepriseName", value)
                }
              />

              <FormField
                form={form}
                name="email"
                label={tans("email")}
                customValidator={(value) => validateField("email", value)}
              />
              <FormField
                form={form}
                name="password"
                label={tans("password")}
                type="password"
                customValidator={(value) => validateField("password", value)}
              />
            </FieldGroup>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <div className="w-full">
            <Button
              type="submit"
              form="login-form"
              disabled={isSubmitting}
              className="w-full"
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
          </div>

          <div className="flex justify-center w-full">
            <Button
              disabled={isSubmitting}
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                setError("");
              }}
              size="sm"
            >
              {tans("footer.resetButtonText")}
            </Button>
          </div>

          <div className="text-center space-y-2 text-sm">
            <p className="text-muted-foreground">
              {tans("footer.question.text")}{" "}
              <Link
                href={ROUTE.AUTH.REGISTER}
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
      </Card>
    </div>
  );
}
