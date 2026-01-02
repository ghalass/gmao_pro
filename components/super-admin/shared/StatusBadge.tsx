import React from "react";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  active: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  active,
  className = "",
}) => {
  return (
    <Badge
      variant={active ? "default" : "secondary"}
      className={`${className} ${
        active
          ? "bg-green-100 text-green-800 hover:bg-green-200"
          : "bg-red-100 text-red-800 hover:bg-red-200"
      }`}
    >
      {active ? "Actif" : "Inactif"}
    </Badge>
  );
};
