// components/modal.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, LucideIcon } from "lucide-react";
import { useState, useEffect } from "react";
import FormError from "./form/FormError";

type ModalProps = {
  label: string;
  title: string;
  sub_title: string;
  sublit_button_title: string;
  sublit_button_icon?: LucideIcon;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isSubmitting?: boolean;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  onSubmit?: (formData: FormData, closeModal: () => void) => void;
  error?: string | null;
};

export function Modal({
  label = "Open Dialog",
  title,
  sub_title,
  sublit_button_title,
  sublit_button_icon: Icon,
  children,
  open: externalOpen,
  onOpenChange,
  isSubmitting: externalIsSubmitting,
  onSubmittingChange,
  onSubmit,
  error,
}: ModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [internalIsSubmitting, setInternalIsSubmitting] = useState(false);

  // Utiliser la prop open si fournie, sinon l'état interne
  const open = externalOpen !== undefined ? externalOpen : internalOpen;

  // Utiliser la prop isSubmitting si fournie, sinon l'état interne
  const isSubmitting =
    externalIsSubmitting !== undefined
      ? externalIsSubmitting
      : internalIsSubmitting;

  const setOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    } else {
      setInternalOpen(value);
    }
  };

  const setSubmitting = (value: boolean) => {
    if (onSubmittingChange) {
      onSubmittingChange(value);
    } else {
      setInternalIsSubmitting(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);

      if (onSubmit) {
        await onSubmit(formData, () => setOpen(false));
      }
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Réinitialiser l'état de soumission quand le modal se ferme
  useEffect(() => {
    if (!open) {
      setSubmitting(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* <form onSubmit={handleSubmit}> */}
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{sub_title}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <FormError error={error} />
          {children}
        </div>
        {/* <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Annuler
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <>{Icon && <Icon className="mr-2 h-4 w-4" />}</>
            )}
            {sublit_button_title}
          </Button>
        </DialogFooter> */}
        {/* </form> */}
      </DialogContent>
    </Dialog>
  );
}
