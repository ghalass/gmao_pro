/**
 * Fonction utilitaire pour formater les messages d'erreur de manière plus informative
 */

interface PrismaError extends Error {
  code?: string;
  meta?: {
    target?: string[];
    cause?: string;
    field_name?: string;
  };
}

// Mapping des noms de tables vers des noms plus compréhensibles
const TABLE_NAMES: Record<string, string> = {
  saisie_hrm: "saisie HRM",
  saisie_him: "saisie HIM",
  saisie_lubrifiant: "saisie de lubrifiant",
  engin: "engin",
  parc: "parc",
  site: "site",
  panne: "panne",
  typepanne: "type de panne",
  typeparc: "type de parc",
  typeorgane: "type d'organe",
  organe: "organe",
  lubrifiant: "lubrifiant",
  typelubrifiant: "type de lubrifiant",
  typeconsommationlub: "type de consommation de lubrifiant",
  objectif: "objectif",
  user: "utilisateur",
  role: "rôle",
  permission: "permission",
  entreprise: "entreprise",
};

/**
 * Formate un message d'erreur en fonction du type d'erreur
 * @param error - L'erreur capturée
 * @param context - Le contexte de l'opération (ex: "suppression de la saisie HRM")
 * @returns Un message d'erreur formaté et compréhensible
 */
export function formatErrorMessage(
  error: unknown,
  context: string
): { message: string; status: number } {
  const err = error as PrismaError;

  // Erreurs Prisma spécifiques
  if (err.code) {
    switch (err.code) {
      case "P2002":
        // Violation de contrainte unique
        const target = err.meta?.target || [];
        const fieldNames = target.join(", ");
        return {
          message: `Une entrée avec cette combinaison (${fieldNames}) existe déjà. Veuillez utiliser des valeurs différentes.`,
          status: 409,
        };

      case "P2003":
        // Violation de clé étrangère (tentative de suppression d'un enregistrement référencé)
        const fieldName = err.meta?.field_name || "champ";
        const cause = err.meta?.cause || "";
        if (cause.includes("delete") || context.includes("suppression")) {
          return {
            message: `Impossible de supprimer cette entrée car elle est référencée par d'autres données (${fieldName}). Veuillez d'abord supprimer les références associées avant de réessayer.`,
            status: 409,
          };
        }
        return {
          message: `Impossible d'effectuer cette opération car la référence (${fieldName}) n'existe pas ou est invalide.`,
          status: 400,
        };

      case "P2025":
        // Enregistrement non trouvé
        return {
          message: `L'enregistrement que vous tentez de modifier ou supprimer n'existe pas ou a déjà été supprimé.`,
          status: 404,
        };

      case "P2014":
        // Violation de contrainte de relation
        return {
          message: `Impossible d'effectuer cette opération en raison d'une contrainte de relation. Veuillez vérifier les données associées.`,
          status: 400,
        };

      default:
        return {
          message: `Erreur de base de données (${
            err.code
          }) lors de la ${context}. ${err.message || ""}`,
          status: 500,
        };
    }
  }

  // Détection des erreurs de contrainte de clé étrangère dans le message (même sans code Prisma)
  if (err instanceof Error && err.message) {
    // Pattern pour détecter les violations de contrainte de clé étrangère
    const foreignKeyPattern =
      /violates (RESTRICT|CASCADE|SET NULL|SET DEFAULT) setting of foreign key constraint "([^"]+)" on table "([^"]+)"/i;
    const match = err.message.match(foreignKeyPattern);

    if (match) {
      const constraintName = match[2];
      const referencedTable = match[3];
      const tableName = TABLE_NAMES[referencedTable] || referencedTable;

      // Si c'est une opération de suppression
      if (context.includes("suppression") || err.message.includes("delete")) {
        return {
          message: `Impossible de supprimer cette entrée car elle est référencée par des ${tableName}(s). Veuillez d'abord supprimer les ${tableName}(s) associé(s) avant de réessayer.`,
          status: 409,
        };
      }

      // Si c'est une opération de mise à jour
      if (context.includes("mise à jour") || context.includes("modification")) {
        return {
          message: `Impossible de modifier cette entrée car elle est référencée par des ${tableName}(s).`,
          status: 409,
        };
      }

      return {
        message: `Impossible d'effectuer cette opération car cette entrée est référencée par des ${tableName}(s).`,
        status: 409,
      };
    }

    // Si c'est déjà un message d'erreur formaté, on le retourne
    if (
      err.message.includes("requis") ||
      err.message.includes("doit être") ||
      err.message.includes("existe déjà") ||
      err.message.includes("non trouvé") ||
      err.message.includes("Impossible de supprimer") ||
      err.message.includes("référencée")
    ) {
      return {
        message: err.message,
        status: 400,
      };
    }

    // Sinon, on formate le message de manière générique
    return {
      message: `Une erreur s'est produite lors de la ${context}. Veuillez réessayer ou contacter le support si le problème persiste.`,
      status: 500,
    };
  }

  // Erreur générique
  return {
    message: `Une erreur inattendue s'est produite lors de la ${context}. Veuillez réessayer ou contacter le support si le problème persiste.`,
    status: 500,
  };
}
