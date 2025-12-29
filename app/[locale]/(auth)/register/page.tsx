// app/[locale]/register/page.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/form/FormField";
import { useRegisterForm } from "@/hooks/auth/useRegisterForm";
import { FormSelectField } from "@/components/form/FormSelectField";
import { useScopedI18n } from "@/locales/client";
import { ROUTE } from "@/lib/routes";
import AuthFooter from "../_components/auth-footer";
import AuthHeader from "../_components/auth-header";

export default function RegisterPage() {
  const { form, error, setError, isSubmitting, validateField } =
    useRegisterForm();
  const tans = useScopedI18n("pages.register");

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
                disabled={isSubmitting}
              />
              <FormField
                form={form}
                name="name"
                label={tans("name")}
                customValidator={(value) => validateField("name", value)}
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
                disabled={isSubmitting}
              />
            </FieldGroup>
          </form>
        </CardContent>

        <AuthFooter
          formName="register-form"
          goToRoute={ROUTE.AUTH.LOGIN}
          isSubmitting={isSubmitting}
          onReset={handleReset}
          page="register"
        />
      </Card>
    </div>
  );
}
