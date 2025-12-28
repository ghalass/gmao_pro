// components/auth/AuthCardHeader.tsx
"use client";

import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ModeToggle from "@/components/ModeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import FormError from "@/components/form/FormError";

interface AuthHeaderProps {
  title: string;
  description?: string;
  error?: string | null;
}

export default function AuthHeader({
  title,
  description,
  error,
}: AuthHeaderProps) {
  return (
    <CardHeader>
      <div className="flex justify-between items-center">
        <ModeToggle />
        <LanguageSwitcher />
      </div>

      <CardTitle className="text-2xl text-center">{title}</CardTitle>

      {description && (
        <CardDescription className="text-center">{description}</CardDescription>
      )}

      <FormError error={error || null} />
    </CardHeader>
  );
}
