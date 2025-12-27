"use client";

import { API } from "@/lib/api";
import { UserDetail } from "@/lib/types";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Type pour l'utilisateur avec conversion vers UserDetail
type User = UserDetail | null;

interface UserContextType {
  user: User;
  setUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  // Utiliser UserDetail comme type pour l'état
  const [user, setUser] = useState<UserDetail | null>(null);

  // Fonction pour rafraîchir les données utilisateur
  async function refreshUser() {
    try {
      const res = await fetch(API.AUTH.ME);
      if (res.ok) {
        const data = await res.json();
        // Vérifier si l'API renvoie { user: ... } ou directement l'utilisateur
        const userData = data.user !== undefined ? data.user : data;

        // Convertir en UserDetail
        const typedUser: UserDetail = {
          id: userData?.id || "",
          name: userData.name || "",
          email: userData.email || "",
          active: Boolean(userData.active),
          createdAt: userData.createdAt || new Date().toISOString(),
          updatedAt: userData.updatedAt || new Date().toISOString(),
          roles: Array.isArray(userData.roles) ? userData.roles : [],
          permissions: Array.isArray(userData.permissions)
            ? userData.permissions
            : [],
          roleNames: Array.isArray(userData.roleNames)
            ? userData.roleNames
            : [],
        };

        setUser(typedUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
    }
  }

  // Initialiser l'utilisateur au montage du composant
  useEffect(() => {
    let isMounted = true;

    const initUser = async () => {
      try {
        const res = await fetch(API.AUTH.ME);
        if (!isMounted) return;

        if (!res.ok) {
          setUser(null);
          return;
        }

        const data = await res.json();
        const userData = data.user !== undefined ? data.user : data;

        // Convertir en UserDetail
        const typedUser: UserDetail = {
          id: userData?.id || "",
          name: userData?.name || "",
          email: userData?.email || "",
          active: Boolean(userData?.active),
          createdAt: userData?.createdAt || new Date().toISOString(),
          updatedAt: userData?.updatedAt || new Date().toISOString(),
          roles: Array.isArray(userData?.roles) ? userData?.roles : [],
          permissions: Array.isArray(userData?.permissions)
            ? userData?.permissions
            : [],
          roleNames: Array.isArray(userData?.roleNames)
            ? userData?.roleNames
            : [],
        };

        setUser(typedUser);
      } catch (error) {
        console.error("Error fetching user:", error);
        if (isMounted) {
          setUser(null);
        }
      }
    };

    initUser();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
}
