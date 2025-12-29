import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useScopedI18n } from "@/locales/client";
import { Shield } from "lucide-react";
import { getJoinedDate } from "@/lib/utils";
import { useCurrentLocale } from "@/locales/client";

interface RolesPermissionsCardProps {
  roles: Array<{
    id: string;
    name: string;
    description?: string | null;
  }>;
  updatedAt: string;
}

export const RolesPermissionsCard = ({
  roles,
  updatedAt,
}: RolesPermissionsCardProps) => {
  const t = useScopedI18n("pages.profile");
  const locale = useCurrentLocale();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <div>
          <CardTitle>{t("roleAndPermissions.title")}</CardTitle>
          <CardDescription>{t("roleAndPermissions.subTitle")}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>{t("roleAndPermissions.titleBody")}</Label>
          <div className="flex flex-wrap gap-1">
            {roles && roles.length > 0 ? (
              roles.map((role, index) => (
                <Badge key={index} variant="secondary" className="capitalize">
                  {role.name || t("roleAndPermissions.notRoles")}
                </Badge>
              ))
            ) : (
              <Badge variant="outline">
                {t("roleAndPermissions.notRoles")}
              </Badge>
            )}
          </div>
        </div>
        <Separator />
        <div className="space-y-2">
          <Label>{t("roleAndPermissions.lastUpdate")}</Label>
          <p className="text-sm text-muted-foreground">
            {getJoinedDate(updatedAt, locale)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
