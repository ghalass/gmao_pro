import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

interface EnterpriseSelectorProps {
  entreprises: Array<{
    id: string;
    name: string;
    active: boolean;
  }>;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showActiveOnly?: boolean;
}

export const EnterpriseSelector: React.FC<EnterpriseSelectorProps> = ({
  entreprises,
  value,
  onChange,
  placeholder = "Sélectionner une entreprise",
  showActiveOnly = false,
}) => {
  const filteredEntreprises = showActiveOnly
    ? entreprises.filter((e) => e.active)
    : entreprises;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <Building2 className="h-4 w-4 mr-2" />
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {filteredEntreprises.map((entreprise) => (
          <SelectItem key={entreprise.id} value={entreprise.id}>
            <div className="flex items-center gap-2">
              <span>{entreprise.name}</span>
              {!entreprise.active && (
                <span className="text-xs text-muted-foreground">(inactif)</span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
