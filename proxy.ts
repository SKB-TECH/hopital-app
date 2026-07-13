import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);
const ACCESS_TOKEN_KEY = "accessToken";
const DEFAULT_LOCALE = routing.defaultLocale;
const SUPPORTED_LOCALES = new Set<string>(routing.locales);

const PUBLIC_LOCALE_PATHS = new Set([
  "",
  "login",
  "forgot-password",
  "login-error",
  "otp-verification",
  "register",
  "register-filled",
  "auth/forgot-password",
  "auth/reset-password",
  "auth/verify-otp",
]);

const PUBLIC_PREFIXES = [
  "/api",
  "/_next",
  "/favicon.ico",
  "/logo.png",
  "/images",
  "/assets",
];

function getLocaleAndPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const first = parts[0];

  if (first && SUPPORTED_LOCALES.has(first)) {
    return {
      locale: first,
      pathWithoutLocale: parts.slice(1).join("/"),
      hasLocale: true,
    };
  }

  return {
    locale: DEFAULT_LOCALE,
    pathWithoutLocale: parts.join("/"),
    hasLocale: false,
  };
}

function isStaticOrApiPath(pathname: string) {
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isPublicLocalePath(pathWithoutLocale: string) {
  if (PUBLIC_LOCALE_PATHS.has(pathWithoutLocale)) return true;
  return pathWithoutLocale.startsWith("auth/");
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isStaticOrApiPath(pathname)) {
    return NextResponse.next();
  }

  const { locale, pathWithoutLocale, hasLocale } = getLocaleAndPath(pathname);
  const accessToken = request.cookies.get(ACCESS_TOKEN_KEY)?.value;
  const isPublicPath = isPublicLocalePath(pathWithoutLocale);

  if (!hasLocale) {
    return intlMiddleware(request);
  }

  if (accessToken && isPublicPath) {
    return NextResponse.redirect(new URL(`/${locale}/overview`, request.url));
  }

  if (!accessToken && !isPublicPath) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    if (pathWithoutLocale) {
      loginUrl.searchParams.set("next", `${pathname}${search}`);
    }

    return NextResponse.redirect(loginUrl);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
