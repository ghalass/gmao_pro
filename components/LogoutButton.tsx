"use client";

import { useLogoutForm } from "@/hooks/auth/useLogoutForm";
import { useScopedI18n } from "@/locales/client";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const tans = useScopedI18n("navbar");
  const { form } = useLogoutForm();

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
