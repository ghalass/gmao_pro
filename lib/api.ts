// lib/api.ts - Version corrigée

// Configuration depuis .env
const SIMULATE_DELAY = process.env.NEXT_PUBLIC_SIMULATE_API_DELAY === "true";
const DELAY_MS = parseInt(process.env.NEXT_PUBLIC_API_DELAY_MS || "500");

// Délai unique global
let GLOBAL_API_DELAY = SIMULATE_DELAY ? DELAY_MS : 0;
let DELAY_ENABLED = SIMULATE_DELAY;

export const API = {
  AUTH: {
    LOGIN: `/api/auth/login`,
    REGISTER: `/api/auth/register`,
    ME: `/api/auth/me`,
    LOGOUT: `/api/auth/logout`,
    EDIT_PROFILE: `/api/auth/profile`,
    CHANGE_PASSWORD: `/api/auth/change-password`,
    SUPER_ADMIN_LOGIN: `/api/super-admin/login`,
  },
  SUPER_ADMIN: {
    GET_ALL_ENTREPRISES: "/api/super-admin/entreprises",
    GET_ONE_ENTREPRISE: (entrepriseId: string) =>
      `/api/super-admin/entreprises/${entrepriseId}`,
  },
  USERS: {
    ALL: "/api/users",
    USER_CREATE: "/api/users",
    USER_DETAILS: (userId: string) => `/api/users/${userId}`,
    USER_UPDATE: (userId: string) => `/api/users/${userId}`,
    USER_DELETE: (userId: string) => `/api/users/${userId}`,
  },
  ROLES: {
    ALL: "/api/roles",
    ROLE_CREATE: "/api/roles",
    ROLE_DETAILS: (roleId: string) => `/api/roles/${roleId}`,
    ROLE_UPDATE: (roleId: string) => `/api/roles/${roleId}`,
    ROLE_DELETE: (roleId: string) => `/api/roles/${roleId}`,
  },
  PERMISSIONS: {
    ALL: "/api/permissions",
    PERMISSION_CREATE: "/api/permissions",
    PERMISSION_DETAILS: (id: string) => `/api/permissions/${id}`,
    PERMISSION_UPDATE: (id: string) => `/api/permissions/${id}`,
    PERMISSION_DELETE: (id: string) => `/api/permissions/${id}`,
    RESOURCES: "/api/permissions/resources",
  },
  SITES: {
    ALL: "/api/sites",
    SITE_CREATE: "/api/sites",
    SITE_DETAILS: (id: string) => `/api/sites/${id}`,
    SITE_UPDATE: (id: string) => `/api/sites/${id}`,
    SITE_DELETE: (id: string) => `/api/sites/${id}`,
  },
  TYPEPARCS: {
    ALL: "/api/typeparcs",
    TYPEPARC_CREATE: "/api/typeparcs",
    TYPEPARC_DETAILS: (id: string) => `/api/typeparcs/${id}`,
    TYPEPARC_UPDATE: (id: string) => `/api/typeparcs/${id}`,
    TYPEPARC_DELETE: (id: string) => `/api/typeparcs/${id}`,
  },
  TYPEPANNES: {
    ALL: "/api/typepannes",
    TYPEPANNE_CREATE: "/api/typepannes",
    TYPEPANNE_DETAILS: (id: string) => `/api/typepannes/${id}`,
    TYPEPANNE_UPDATE: (id: string) => `/api/typepannes/${id}`,
    TYPEPANNE_DELETE: (id: string) => `/api/typepannes/${id}`,
  },
  PANNES: {
    ALL: "/api/pannes",
    PANNE_CREATE: "/api/pannes",
    PANNE_DETAILS: (id: string) => `/api/pannes/${id}`,
    PANNE_UPDATE: (id: string) => `/api/pannes/${id}`,
    PANNE_DELETE: (id: string) => `/api/pannes/${id}`,
  },
  PARCS: {
    ALL: "/api/parcs",
    PARC_CREATE: "/api/parcs",
    PARC_DETAILS: (id: string) => `/api/parcs/${id}`,
    PARC_UPDATE: (id: string) => `/api/parcs/${id}`,
    PARC_DELETE: (id: string) => `/api/parcs/${id}`,
  },
  ENGINS: {
    ALL: "/api/engins",
    ENGIN_CREATE: "/api/engins",
    ENGIN_DETAILS: (id: string) => `/api/engins/${id}`,
    ENGIN_UPDATE: (id: string) => `/api/engins/${id}`,
    ENGIN_DELETE: (id: string) => `/api/engins/${id}`,
  },
};

export enum methods {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
}

export async function apiFetch<T = any>(
  url: string,
  options?: {
    method?: methods;
    body?: any;
    headers?: Record<string, string>;
    skipDelay?: boolean; // Option pour désactiver manuellement
    cookies?: Record<string, string>; // Option pour passer des cookies manuellement
  }
) {
  // CORRECTION : Convertir l'URL relative en URL absolue si nécessaire
  let fullUrl = url;

  // Si l'URL ne commence pas par http:// ou https://
  if (!url.startsWith("http")) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    fullUrl = `${baseUrl}${url}`;
  }

  // Appliquer le délai automatiquement si activé et non désactivé manuellement
  const shouldDelay = !options?.skipDelay && DELAY_ENABLED;

  if (shouldDelay && GLOBAL_API_DELAY > 0) {
    // console.log(`⏱️ API delay: ${GLOBAL_API_DELAY}ms for ${fullUrl}`);
    await new Promise((resolve) => setTimeout(resolve, GLOBAL_API_DELAY));
  }

  try {
    // Préparer les headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options?.headers,
    };

    // Ajouter les cookies si on est côté serveur
    let cookiesToSend = options?.cookies;

    if (!cookiesToSend && typeof window === "undefined") {
      // On est côté serveur, essayer de récupérer les cookies automatiquement
      try {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        const allCookies = cookieStore.getAll();

        cookiesToSend = allCookies.reduce((acc, cookie) => {
          acc[cookie.name] = cookie.value;
          return acc;
        }, {} as Record<string, string>);
      } catch (error) {
        console.error("Impossible de récupérer les cookies automatiquement");
      }
    }

    // Ajouter les cookies au header si disponibles
    if (cookiesToSend && Object.keys(cookiesToSend).length > 0) {
      const cookieString = Object.entries(cookiesToSend)
        .map(([key, value]) => `${key}=${value}`)
        .join("; ");

      headers["Cookie"] = cookieString;
      // console.log("Cookies envoyés:", Object.keys(cookiesToSend));
    }

    const response = await fetch(fullUrl, {
      method: options?.method || methods.GET,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
      credentials: "include", // Important pour inclure les cookies
    });

    const data = await response.json();

    return {
      ok: response.ok,
      status: response.status,
      data: data as T,
    };
  } catch (error) {
    console.error("API Error:", error);

    return {
      ok: false,
      status: 500,
      data: {
        error: "Network Error",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      } as T,
    };
  }
}
