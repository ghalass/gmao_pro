// app/[locale]/register/page.tsx
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
import { FormField } from "@/components/form/FormField";
import { useRegisterForm } from "@/hooks/auth/useRegisterForm";
import { FormSelectField } from "@/components/form/FormSelectField";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useScopedI18n } from "@/locales/client";
import { ROUTE } from "@/lib/routes";

export default function RegisterPage() {
  const { form, error, setError, isSubmitting, validateField } =
    useRegisterForm();
  const tans = useScopedI18n("pages.register");

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
            <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400 text-center">
                {error}
              </p>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <form
            id="register-form"
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
                name="name"
                label={tans("name")}
                customValidator={(value) => validateField("name", value)}
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
              <FormSelectField
                form={form}
                name="lang"
                label={tans("lang.label")}
                placeholder={tans("lang.text")}
                groupLabel="Langues"
                options={[
                  { label: "Français", value: "fr" },
                  { label: "العربية", value: "ar" },
                ]}
              />
            </FieldGroup>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button
              disabled={isSubmitting}
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                setError("");
              }}
              className="flex-1"
            >
              {tans("footer.resetButtonText")}
            </Button>
            <Button
              type="submit"
              form="register-form"
              disabled={isSubmitting}
              className="flex-1"
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

          <div className="text-center space-y-2 text-sm mt-4">
            <p className="text-gray-600 dark:text-gray-400">
              {tans("footer.question.text")}{" "}
              <Link
                href={ROUTE.AUTH.LOGIN}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                {tans("footer.question.linkText")}
              </Link>
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <Link
                href={ROUTE.MAIN}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
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
