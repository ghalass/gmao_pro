// proxy.ts
import { createI18nMiddleware } from "next-international/middleware";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "./lib/auth";

const I18nMiddleware = createI18nMiddleware({
  locales: ["ar", "fr"],
  defaultLocale: "fr",
});

// Fonction pour extraire la locale du pathname
function getLocaleFromPathname(pathname: string): string {
  const localeMatch = pathname.match(/^\/(ar|fr)(\/|$)/);
  return localeMatch ? localeMatch[1] : "fr";
}

// Fonction pour enlever la locale du pathname
function removeLocaleFromPathname(pathname: string): string {
  if (pathname === "/fr" || pathname === "/fr/") return "/";
  if (pathname === "/ar" || pathname === "/ar/") return "/";

  if (pathname.startsWith("/fr/")) {
    const result = pathname.substring(3);
    return result || "/";
  } else if (pathname.startsWith("/ar/")) {
    const result = pathname.substring(3);
    return result || "/";
  }
  return pathname;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Liste des extensions à ignorer
  const staticExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".ico",
    ".css",
    ".js",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".map",
  ];

  // Ignorer les fichiers statiques et d'assets de manière plus complète
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/fonts/") ||
    pathname.startsWith("/public/") ||
    pathname.includes("/_next/") ||
    staticExtensions.some((ext) => pathname.endsWith(ext))
  ) {
    return NextResponse.next();
  }

  // ✅ TOUTES les API - ne pas appliquer le middleware i18n
  if (pathname.startsWith("/api/")) {
    // Gestion de l'authentification uniquement pour les API
    const session = await getSession();

    // Définir les API publiques (sans authentification requise)
    const publicApis = [
      "/api/auth/login",
      "/api/auth/register",
      "/api/auth/me",
    ];

    // Vérifier si c'est une API publique
    const isPublicApi = publicApis.some(
      (api) => pathname === api || pathname.startsWith(api + "/")
    );

    // 🔓 API publiques - pas besoin d'authentification
    if (isPublicApi) {
      return NextResponse.next();
    }

    // 🔒 API privées - vérifier l'authentification
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    // API autorisées (authentifiées)
    return NextResponse.next();
  }

  // ✅ Pour les pages (non-API) - appliquer la logique de traduction
  const currentLocale = getLocaleFromPathname(pathname);
  const pathWithoutLocale = removeLocaleFromPathname(pathname);
  const session = await getSession();

  // Liste des chemins publics
  const publicPaths = ["/", "/login", "/register"];

  // Vérifier si c'est une page publique
  const isPublicPage = publicPaths.some((path) => {
    if (pathWithoutLocale === path) return true;
    if (path !== "/" && pathWithoutLocale.startsWith(path + "/")) return true;
    return false;
  });

  // 🔓 Pages publiques
  if (isPublicPage) {
    // Rediriger vers l'accueil si déjà connecté sur login/register
    if (session.isLoggedIn) {
      if (pathWithoutLocale === "/login" || pathWithoutLocale === "/register") {
        const homeUrl = currentLocale === "fr" ? "/" : `/${currentLocale}/`;
        return NextResponse.redirect(new URL(homeUrl, request.url));
      }
    }
    // Appliquer le middleware i18n
    return I18nMiddleware(request);
  }

  // 🔒 Pages privées
  if (!session.isLoggedIn) {
    // Rediriger vers le login
    const loginUrl =
      currentLocale === "fr" ? "/login" : `/${currentLocale}/login`;
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }

  // Pages privées accessibles
  return I18nMiddleware(request);
}

export const config = {
  matcher: [
    // Cette regex exclut déjà les API de manière sûre
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|.*\\.(?:png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|eot|map)$).*)",
  ],
};
