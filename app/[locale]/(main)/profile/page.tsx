"use client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import { useUser } from "@/context/UserContext";
import { API, apiFetch } from "@/lib/api";
import { getInitials, getJoinedDate } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Edit3, Key, Mail, Save, Shield, User } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface UserData {
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

interface ProfileFormData {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ProfilPage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        console.error("Erreur de connection:", err);
        if (err.name === "ValidationError" && err.errors) {
          // setError(err.errors.join(", "));
        } else if (err.response?.data?.message) {
          // setError(err.response.data.message);
        } else {
          // setError(err.message || "Erreur lors de connection");
        }
        // console.error("Erreur lors de la récupération du profil:", error);
        throw err;
      }
    },
  });

  const handleSaveProfile = async () => {
    setError(null);

    try {
      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
      };
      console.log(updateData);

      const response = await apiFetch(API.AUTH.EDIT_PROFILE, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: updateData,
      });

      if (response.ok) {
        await refreshUser();
        toast.success("Profil mis à jour avec succès");
        setIsEditing(false);
      } else {
        const errorData = response.data?.message;
        console.error(errorData);
        throw new Error(errorData);
      }

      // Réinitialiser le message de succès après 3 secondes
      // setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Erreur de connection:", err);
      if (err.name === "ValidationError" && err.errors) {
        // setError(err.errors.join(", "));
      } else if (err.response?.data?.message) {
        // setError(err.response.data.message);
      } else {
        // setError(err.message || "Erreur lors de connection");
      }
      // console.error("Erreur lors de la récupération du profil:", error);
      throw err;
    }
  };

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleChangePassword = async () => {
    setError(null);

    // Validation
    if (!formData.currentPassword) {
      setError("Le mot de passe actuel est requis");
      return;
    }

    if (!formData.newPassword) {
      setError("Le nouveau mot de passe est requis");
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      const response = await fetch("/api/users/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Erreur lors du changement de mot de passe"
        );
      }

      toast.success("Mot de passe changé avec succès");

      // Réinitialiser les champs de mot de passe
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error) {
      console.error("Erreur lors du changement de mot de passe:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Erreur lors du changement de mot de passe"
      );
    }
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

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <User className="h-8 w-8" />
            Mon Profil
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos informations personnelles et vos préférences
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleSaveProfile}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Sauvegarder
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Modifier le profil
            </Button>
          )}
        </div>
      </div>

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
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>
                  Mettez à jour vos informations de compte
                </CardDescription>
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
                  <p className="text-lg font-semibold">
                    {user?.name || "Nom non défini"}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      Membre depuis {getJoinedDate(user?.createdAt || "")}
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
                  <Label htmlFor="name">Nom complet *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    disabled={!isEditing}
                    placeholder="Votre nom complet"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ce nom sera affiché dans l'application
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    disabled={!isEditing}
                    placeholder="votre@email.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Utilisée pour la connexion
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Changement de mot de passe */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Changer le mot de passe</CardTitle>
                <CardDescription>
                  Mettez à jour votre mot de passe de connexion
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mot de passe actuel *</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) =>
                    handleInputChange("currentPassword", e.target.value)
                  }
                  placeholder="••••••••"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe *</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) =>
                      handleInputChange("newPassword", e.target.value)
                    }
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum 6 caractères
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirmer le mot de passe *
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={
                  !formData.currentPassword ||
                  !formData.newPassword ||
                  !formData.confirmPassword ||
                  formData.newPassword.length < 6
                }
                className="flex items-center gap-2"
              >
                <Key className="h-4 w-4" />
                Changer le mot de passe
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Rôles et permissions */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Rôles et permissions</CardTitle>
                <CardDescription>Vos accès dans l'application</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Rôles attribués</Label>
                <div className="flex flex-wrap gap-1">
                  {user?.roles && user.roles.length > 0 ? (
                    user.roles.map((role, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="capitalize"
                      >
                        {role.name || "Rôle inconnu"}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline">Aucun rôle</Badge>
                  )}
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Dernière mise à jour</Label>
                <p className="text-sm text-muted-foreground">
                  {getJoinedDate(user?.updatedAt || "")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilPage;
