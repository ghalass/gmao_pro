import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getInitials = (name: string | undefined | null) => {
  if (!name || typeof name !== "string") {
    return "U"; // Initiales par défaut
  }

  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    return "U";
  }

  return trimmedName
    .split(" ")
    .map((part) => part[0] || "")
    .filter((initial) => initial) // Filtrer les chaînes vides
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const getJoinedDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "Date inconnue";
  }
};
