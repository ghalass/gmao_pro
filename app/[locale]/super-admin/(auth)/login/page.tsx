// app/[locale]/super-admin/(auth)login/page.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { useScopedI18n } from "@/locales/client";
import { FormField } from "@/components/form/FormField";
import SuperAdminAuthFooter from "../_components/auth-footer";
import SuperAdminAuthHeader from "../_components/auth-header";
import { useSuperAdminLoginForm } from "@/hooks/auth/useSuperAdminLoginForm";

export default function SuperAdminLoginPage() {
  const { form, error, setError, isSubmitting, validateField } =
    useSuperAdminLoginForm();
  const tans = useScopedI18n("pages.login");

  const handleReset = () => {
    form.reset();
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col gap-4 items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <SuperAdminAuthHeader
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

        <SuperAdminAuthFooter
          formName="login-form"
          isSubmitting={isSubmitting}
          onReset={handleReset}
          page="login"
        />
      </Card>
    </div>
  );
}
