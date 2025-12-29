import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { ProfileHeader } from "./ProfileHeader";
import { PersonalInfoCard } from "./PersonalInfoCard";
import { PasswordChangeCard } from "./PasswordChangeCard";
import { RolesPermissionsCard } from "./RolesPermissionsCard";
import { UserData, ProfileFormData } from "@/hooks/useProfile";

interface ProfileViewProps {
  // États
  isEditing: boolean;
  isChangingPassword: boolean;
  isUpdatingProfil: boolean;
  error: string | null;
  errorChangePassword: string | null;
  formData: ProfileFormData;
  user: UserData | undefined;
  userLoading: boolean;
  userError: Error | null;

  // Setters
  setIsEditing: (value: boolean) => void;

  // Handlers
  handleSaveProfile: () => Promise<void>;
  handlePersonalInfoChange: (field: "name" | "email", value: string) => void;
  handlePasswordInputChange: (
    field: "currentPassword" | "newPassword" | "confirmPassword",
    value: string
  ) => void;
  handleChangePassword: () => Promise<void>;
  handleResetPasswordForm: () => void;
}

export const ProfileView = ({
  isEditing,
  isChangingPassword,
  isUpdatingProfil,
  error,
  errorChangePassword,
  formData,
  user,
  userLoading,
  userError,
  setIsEditing,
  handleSaveProfile,
  handlePersonalInfoChange,
  handlePasswordInputChange,
  handleChangePassword,
  handleResetPasswordForm,
}: ProfileViewProps) => {
  if (userLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (userError) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>
            Erreur lors du chargement du profil
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* En-tête */}
      <ProfileHeader
        isUpdatingProfil={isUpdatingProfil}
        isEditing={isEditing}
        onEdit={() => setIsEditing(true)}
        onSave={handleSaveProfile}
        onCancel={() => setIsEditing(false)}
      />

      {/* Messages d'alerte */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations personnelles */}
          {user && (
            <PersonalInfoCard
              user={{
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
              }}
              formData={formData}
              isEditing={isEditing}
              isUpdatingProfil={isUpdatingProfil}
              onInputChange={handlePersonalInfoChange}
            />
          )}

          {/* Changement de mot de passe */}
          <PasswordChangeCard
            formData={formData}
            error={errorChangePassword}
            isChangingPassword={isChangingPassword}
            onInputChange={handlePasswordInputChange}
            onChangePassword={handleChangePassword}
            onResetPasswordForm={handleResetPasswordForm}
          />
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Rôles et permissions */}
          {user && (
            <RolesPermissionsCard
              roles={user.roles}
              updatedAt={user.updatedAt}
            />
          )}
        </div>
      </div>
    </div>
  );
};
