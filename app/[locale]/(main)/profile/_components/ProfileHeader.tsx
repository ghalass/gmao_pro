import { Button } from "@/components/ui/button";
import { Edit3, Save, User } from "lucide-react";
import { useScopedI18n } from "@/locales/client";
import { Spinner } from "@/components/ui/spinner";

interface ProfileHeaderProps {
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  isUpdatingProfil: boolean;
}

export const ProfileHeader = ({
  isEditing,
  onEdit,
  onSave,
  onCancel,
  isUpdatingProfil,
}: ProfileHeaderProps) => {
  const t = useScopedI18n("pages.profile");

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <User className="h-8 w-8" />
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("subTitle")}</p>
      </div>
      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <Button
              variant="outline"
              hidden={isUpdatingProfil}
              onClick={onCancel}
            >
              {t("cancelButtonText")}
            </Button>
            <Button
              disabled={isUpdatingProfil}
              onClick={onSave}
              className="flex items-center gap-2"
            >
              {isUpdatingProfil ? <Spinner /> : <Save className="h-4 w-4" />}
              {t("saveButtonText")}
            </Button>
          </>
        ) : (
          <Button
            disabled={isUpdatingProfil}
            onClick={onEdit}
            className="flex items-center gap-2"
          >
            <Edit3 className="h-4 w-4" />
            {t("editButtonText")}
          </Button>
        )}
      </div>
    </div>
  );
};
