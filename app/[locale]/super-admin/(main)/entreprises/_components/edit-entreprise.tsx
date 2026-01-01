"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Edit2 } from "lucide-react";

interface Entreprise {
  id: string;
  name: string;
  lang: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EditEntrepriseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  entreprise: Entreprise | null;
}

export const EditEntrepriseDialog: React.FC<EditEntrepriseDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  entreprise,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    lang: "fr",
    active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (entreprise && open) {
      setFormData({
        name: entreprise.name,
        lang: entreprise.lang,
        active: entreprise.active,
      });
    }
  }, [entreprise, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!entreprise) return;

    if (!formData.name.trim()) {
      setErrors({ name: "Le nom est requis" });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch(
        `/api/super-admin/entreprises/${entreprise.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        onSuccess();
        onOpenChange(false);
      } else {
        const error = await response.json();
        setErrors({ name: error.message || "Erreur lors de la modification" });
      }
    } catch (error) {
      setErrors({ name: "Erreur réseau" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-96">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            Modifier l'Entreprise
          </DialogTitle>
          <DialogDescription>
            Modifier les informations de l'entreprise
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de l'entreprise</Label>
            <Input
              id="name"
              placeholder="Nom de l'entreprise"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lang">Langue</Label>
            <Select
              value={formData.lang}
              onValueChange={(value) => handleInputChange("lang", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une langue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => handleInputChange("active", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="active">Entreprise active</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.name.trim()}
            >
              {isSubmitting ? "Modification..." : "Modifier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
