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

export const getJoinedDate = (
  dateString: string | null | Date,
  lang: string = "fr"
) => {
  try {
    // Vérifier d'abord si la chaîne est valide
    if (!dateString) {
      throw new Error("Date string is empty");
    }

    const date = new Date(dateString);

    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }

    let langString = "fr-FR";
    switch (lang) {
      case "ar":
        langString = "ar-AR";
        break;
      default:
        break;
    }

    return date.toLocaleDateString(langString, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return lang === "ar" ? "تاريخ غير معروف" : "Date inconnue";
  }
};
