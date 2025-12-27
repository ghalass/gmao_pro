export const API = {
  AUTH: {
    LOGIN: `/api/auth/login`,
    REGISTER: `/api/auth/register`,
    ME: `/api/auth/me`,
    LOGOUT: `/api/auth/logout`,
  },
};

export async function apiFetch<T = any>(
  url: string,
  options?: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  }
) {
  try {
    const response = await fetch(url, {
      method: options?.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
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
