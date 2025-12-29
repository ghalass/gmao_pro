import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { API, apiFetch, methods } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useScopedI18n } from "@/locales/client";

export interface UserData {
  id: string;
  name: string;
  email: string;
  roles: Array<{
    id: string;
    name: string;
    description?: string | null;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileFormData {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const useProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUpdatingProfil, setIsUpdatingProfil] = useState(false);

  const t = useScopedI18n("pages.profile");

  const [error, setError] = useState<string | null>(null);
  const [errorChangePassword, setErrorChangePassword] = useState<string | null>(
    null
  );

  const { refreshUser } = useUser();

  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Récupérer les données de l'utilisateur
  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useQuery<UserData>({
    queryKey: ["user-profile"],
    queryFn: async () => {
      try {
        const response = await apiFetch(API.AUTH.ME);
        if (response.ok) {
          return response.data as UserData;
        } else {
          const errorData = response.data?.message;
          console.error(errorData);
          throw new Error(errorData);
        }
      } catch (err: any) {
        console.error("Erreur de récupération du profil:", err);
        throw err;
      }
    },
  });

  const handleSaveProfile = async () => {
    setError(null);
    setIsUpdatingProfil(true);

    try {
      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
      };

      const response = await apiFetch(API.AUTH.EDIT_PROFILE, {
        method: methods.PATCH,
        headers: {
          "Content-Type": "application/json",
        },
        body: updateData,
      });

      if (response.ok) {
        await refreshUser();
        toast.success(t("infoPerso.successMessage"));
        setIsEditing(false);
      } else {
        const errorData = response.data?.message;
        console.error(errorData);
        throw new Error(errorData);
      }
    } catch (err: any) {
      console.error("Erreur lors de la mise à jour du profil:", err);
      if (err.name === "ValidationError" && err.errors) {
        setError(err.errors.join(", "));
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(err.message || "Erreur lors de la mise à jour");
      }
    } finally {
      setIsUpdatingProfil(false);
    }
  };

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleChangePassword = async () => {
    setErrorChangePassword(null);
    setIsChangingPassword(true);

    // Validation
    if (!formData.currentPassword) {
      setErrorChangePassword(t("passwordChange.check.currentPasswordRequired"));
      setIsChangingPassword(false);
      return;
    }

    if (!formData.newPassword) {
      setErrorChangePassword(t("passwordChange.check.newPasswordRequired"));
      setIsChangingPassword(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setErrorChangePassword(t("passwordChange.check.newPasswordLength"));
      setIsChangingPassword(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setErrorChangePassword(t("passwordChange.check.newPasswordMatch"));
      setIsChangingPassword(false);
      return;
    }
    setErrorChangePassword(null);

    try {
      const changePasswordData = {
        email: formData.email,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      };

      const response = await apiFetch(API.AUTH.CHANGE_PASSWORD, {
        method: methods.PATCH,
        headers: {
          "Content-Type": "application/json",
        },
        body: changePasswordData,
      });

      if (response.ok) {
        await refreshUser();
        toast.success(t("passwordChange.successMessage"));
        setErrorChangePassword(null);
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      } else {
        const errorData = response.data?.message;
        setErrorChangePassword(errorData);
        console.error(errorData);
      }
    } catch (err: any) {
      console.error("Erreur lors du changement de mot de passe:", err);
      if (err.name === "ValidationError" && err.errors) {
        setErrorChangePassword(err.errors.join(", "));
      } else if (err.response?.data?.message) {
        setErrorChangePassword(err.response.data.message);
      } else {
        setErrorChangePassword(err.message || "Erreur lors du changement");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleResetPasswordForm = () => {
    setFormData((prev) => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
  };

  const handlePersonalInfoChange = (field: "name" | "email", value: string) => {
    handleInputChange(field, value);
  };

  const handlePasswordInputChange = (
    field: "currentPassword" | "newPassword" | "confirmPassword",
    value: string
  ) => {
    handleInputChange(field, value);
  };

  // Mettre à jour formData quand les données utilisateur sont chargées
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  return {
    // États
    isEditing,
    isChangingPassword,
    isUpdatingProfil,
    error,
    errorChangePassword,
    formData,
    user,
    userLoading,
    userError,

    // Setters
    setIsEditing,

    // Handlers
    handleSaveProfile,
    handlePersonalInfoChange,
    handlePasswordInputChange,
    handleChangePassword,
    handleResetPasswordForm,
  };
};
