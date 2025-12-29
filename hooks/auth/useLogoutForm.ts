// hooks/useLogoutForm.ts
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import * as React from "react";
import { API, apiFetch, methods } from "@/lib/api";
import { ROUTE } from "@/lib/routes";
import { useUser } from "@/context/UserContext";

export function useLogoutForm() {
  const router = useRouter();
  const { refreshUser } = useUser();

  const logoutWithAllData = React.useCallback(async () => {
    return apiFetch(API.AUTH.LOGOUT, { method: methods.POST });
  }, []);

  const form = useForm({
    defaultValues: {},
    onSubmit: async () => {
      try {
        const response = await logoutWithAllData();
        if (response.ok) {
          await refreshUser();
          toast.success("Déconnecté avec succès");
          router.push(ROUTE.AUTH.LOGIN);
        } else {
          const errorData = response.data?.message;
          console.error(errorData);
        }
      } catch (err: any) {
        console.error("Erreur de connection:", err);
      }
    },
  });

  return { form };
}
