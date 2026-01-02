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
  ENTREPRISES: {
    ALL: "/entreprises",
  },
};
