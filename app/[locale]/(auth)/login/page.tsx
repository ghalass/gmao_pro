// app/[locale]/login/page.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { useScopedI18n } from "@/locales/client";
import { useLoginForm } from "@/hooks/auth/useLoginForm";
import { FormField } from "@/components/form/FormField";
import { ROUTE } from "@/lib/routes";
import AuthFooter from "../_components/auth-footer";
import AuthHeader from "../_components/auth-header";

export default function LoginPage() {
  const { form, error, setError, isSubmitting, validateField } = useLoginForm();
  const tans = useScopedI18n("pages.login");

  const handleReset = () => {
    form.reset();
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col gap-4 items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <AuthHeader
          title={tans("title")}
          description={tans("description")}
          error={error}
        />

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
                disabled={isSubmitting}
              />

              <FormField
                form={form}
                name="email"
                label={tans("email")}
                customValidator={(value) => validateField("email", value)}
                disabled={isSubmitting}
              />
              <FormField
                form={form}
                name="password"
                label={tans("password")}
                type="password"
                customValidator={(value) => validateField("password", value)}
                disabled={isSubmitting}
              />
            </FieldGroup>
          </form>
        </CardContent>

        <AuthFooter
          formName="login-form"
          goToRoute={ROUTE.AUTH.REGISTER}
          isSubmitting={isSubmitting}
          onReset={handleReset}
          page="login"
        />
      </Card>
    </div>
  );
}
