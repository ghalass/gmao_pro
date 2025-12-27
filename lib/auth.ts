// lib/auth.ts
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string) {
  const passwordMatches = await bcrypt.compare(password, hashedPassword);
  return passwordMatches;
}

export type SessionData = {
  userId: string;
  name: string;
  email: string;
  roles: string[];
  isLoggedIn: boolean;
  permissions: {
    id: string;
    resource: string;
    action: string | null;
    roleId: string;
    roleName: string;
  }[];
};

export const sessionOptions = {
  password: process.env.SESSION_PASSWORD as string,
  cookieName: "auth_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const, // 'lax' | 'strict' | 'none'
    maxAge: process.env.SESSION_MAX_AGE
      ? parseInt(process.env.SESSION_MAX_AGE, 10)
      : 24 * 60 * 60, // 24 heure en secondes
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    sessionOptions
  );

  if (!session.isLoggedIn) {
    session.isLoggedIn = false;
  }

  return session;
}

export async function logout() {
  const session = await getSession();
  session.destroy();
}
