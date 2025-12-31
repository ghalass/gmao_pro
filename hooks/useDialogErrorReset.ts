import { useEffect, useRef } from "react";

/**
 * Hook personnalisé pour réinitialiser les erreurs lors de la fermeture d'un dialog
 * @param open - État d'ouverture du dialog
 * @param setError - Fonction pour réinitialiser l'erreur
 */
export function useDialogErrorReset(
  open: boolean,
  setError: (error: string | null) => void
) {
  const prevOpenRef = useRef(open);

  useEffect(() => {
    // Si le dialog passe de ouvert à fermé, réinitialiser l'erreur
    if (prevOpenRef.current && !open) {
      setError(null);
    }
    prevOpenRef.current = open;
  }, [open, setError]);
}

/**
 * Crée un handler pour onOpenChange qui réinitialise l'erreur lors de la fermeture
 * @param onOpenChange - Handler original pour onOpenChange
 * @param setError - Fonction pour réinitialiser l'erreur
 * @param isSubmitting - État indiquant si une soumission est en cours
 * @returns Handler pour onOpenChange
 */
export function createDialogErrorResetHandler(
  onOpenChange: (open: boolean) => void,
  setError: (error: string | null) => void,
  isSubmitting?: boolean
) {
  return (open: boolean) => {
    if (!open) {
      setError(null);
    }

    if (!isSubmitting) {
      onOpenChange(open);
    }
  };
}
