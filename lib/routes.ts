export const ROUTE = {
  MAIN: "/",
  DASHBOARD: "/dashboard",
  AUTH: {
    LOGIN: `/login`,
    REGISTER: `/register`,
  },
  USERS: {
    ALL: `/users`,
    USER_DETAIL: (userId: string) => `/users/${userId}`,
  },
  SUPER_ADMIN: {
    MAIN: "/super-admin",
    ENTREPRISES_LIST: "/super-admin/entreprises",
    ENTREPRISE_DETAILS: (entrepriseId: string) =>
      `/super-admin/entreprises/${entrepriseId}`,
    ENTREPRISE_USERS: (entrepriseId: string) =>
      `/super-admin/entreprises/${entrepriseId}/users`,
  },
};
