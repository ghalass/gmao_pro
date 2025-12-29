import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useScopedI18n } from "@/locales/client";
import { User, Calendar, Mail } from "lucide-react";
import { getInitials, getJoinedDate } from "@/lib/utils";
import { useCurrentLocale } from "@/locales/client";

interface PersonalInfoCardProps {
  user: {
    name: string;
    email: string;
    createdAt: string;
  };
  formData: {
    name: string;
    email: string;
  };
  isEditing: boolean;
  isUpdatingProfil: boolean;
  onInputChange: (field: "name" | "email", value: string) => void;
}

export const PersonalInfoCard = ({
  user,
  formData,
  isEditing,
  isUpdatingProfil,
  onInputChange,
}: PersonalInfoCardProps) => {
  const t = useScopedI18n("pages.profile");
  const locale = useCurrentLocale();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <User className="h-5 w-5 text-primary" />
        <div>
          <CardTitle>{t("infoPerso.title")}</CardTitle>
          <CardDescription>{t("infoPerso.subTitle")}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="text-xl">
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-lg font-semibold">{user?.name}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {t("infoPerso.membreDepuis")}{" "}
                {getJoinedDate(user?.createdAt || "", locale)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              <span>{user?.email}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("infoPerso.nomComplet")}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onInputChange("name", e.target.value)}
              disabled={!isEditing || isUpdatingProfil}
              placeholder={t("infoPerso.nomComplet")}
            />
            <p className="text-xs text-muted-foreground">
              {t("infoPerso.nomCompletSubTitle")}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("infoPerso.email")}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => onInputChange("email", e.target.value)}
              disabled
              placeholder="votre@email.com"
            />
            <p className="text-xs text-muted-foreground">
              {t("infoPerso.emailSubTitle")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
