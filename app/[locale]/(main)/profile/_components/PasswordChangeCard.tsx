import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FormError from "@/components/form/FormError";
import { Spinner } from "@/components/ui/spinner";
import { useScopedI18n } from "@/locales/client";
import { Key } from "lucide-react";

interface PasswordChangeCardProps {
  formData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  error: string | null;
  isChangingPassword: boolean;
  onInputChange: (
    field: "currentPassword" | "newPassword" | "confirmPassword",
    value: string
  ) => void;
  onChangePassword: () => void;
  onResetPasswordForm: () => void;
}

export const PasswordChangeCard = ({
  formData,
  error,
  isChangingPassword,
  onInputChange,
  onChangePassword,
  onResetPasswordForm,
}: PasswordChangeCardProps) => {
  const t = useScopedI18n("pages.profile");

  const isPasswordFormValid =
    formData.currentPassword &&
    formData.newPassword &&
    formData.confirmPassword &&
    formData.newPassword.length >= 6 &&
    formData.newPassword === formData.confirmPassword;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Key className="h-5 w-5 text-primary" />
        <div>
          <CardTitle>{t("passwordChange.title")}</CardTitle>
          <CardDescription>{t("passwordChange.subTitle")}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormError error={error} />
        <div className="space-y-2">
          <Label htmlFor="currentPassword">
            {t("passwordChange.actuelPassword")}
          </Label>
          <Input
            id="currentPassword"
            type="password"
            value={formData.currentPassword}
            onChange={(e) => onInputChange("currentPassword", e.target.value)}
            placeholder="••••••••"
            disabled={isChangingPassword}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">
              {t("passwordChange.newPassword")}
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={(e) => onInputChange("newPassword", e.target.value)}
              placeholder="••••••••"
              disabled={isChangingPassword}
            />
            <p className="text-xs text-muted-foreground">
              {t("passwordChange.newPasswordSub")}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              {t("passwordChange.confrimPassword")}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => onInputChange("confirmPassword", e.target.value)}
              placeholder="••••••••"
              disabled={isChangingPassword}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onChangePassword}
            disabled={!isPasswordFormValid || isChangingPassword}
            className="flex items-center gap-2"
          >
            {isChangingPassword ? <Spinner /> : <Key className="h-4 w-4" />}
            {t("passwordChange.buttonTitle")}
          </Button>
          {isPasswordFormValid && !isChangingPassword && (
            <Button variant="outline" onClick={onResetPasswordForm}>
              {t("cancelButtonText")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
