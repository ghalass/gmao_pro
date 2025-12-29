"use client";

import { useSuperAdminLogoutForm } from "@/hooks/auth/useSuperAdminLogoutForm";
import { useScopedI18n } from "@/locales/client";
import { LogOut } from "lucide-react";

export default function SuperAdminLogoutButton() {
  const tans = useScopedI18n("navbar");
  const { form } = useSuperAdminLogoutForm();

  return (
    <form
      id="logout-form"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <button
        type="submit"
        form="logout-form"
        className="cursor-pointer flex items-center gap-2"
      >
        <LogOut className="w-4 h-4 text-destructive" />{" "}
        {tans("authButtons.logout")}
      </button>
    </form>
  );
}
