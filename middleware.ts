import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isAdminPath = request.nextUrl.pathname === "/admin" || request.nextUrl.pathname.startsWith("/admin/");
  const isAccountPath = request.nextUrl.pathname === "/account" || request.nextUrl.pathname.startsWith("/account/");
  const authCookieName = process.env.AUTH_COOKIE_NAME || "werd_session";
  const hasAuthCookie = Boolean(request.cookies.get(authCookieName)?.value);
  const response = (isAdminPath || isAccountPath) && !hasAuthCookie
    ? NextResponse.redirect(new URL("/login", request.url))
    : NextResponse.next();
  const isDev = process.env.NODE_ENV !== "production";
  const connectSrc = [
    "'self'",
    process.env.NEXT_PUBLIC_API_URL || "https://hoodie-store-x4hj.onrender.com"
  ].join(" ");

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("Origin-Agent-Cluster", "?1");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(self)");
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      `script-src 'self' ${isDev ? "'unsafe-eval'" : ""} 'unsafe-inline'`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      `connect-src ${connectSrc}`,
      "font-src 'self' data:",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join("; ")
  );

  if (!isDev && request.nextUrl.protocol === "https:") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest).*)"]
};
