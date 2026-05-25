import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/backend";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import {
  hardenJsonResponse,
  isAllowedOrigin,
  isMutatingMethod,
  MAX_MULTIPART_BYTES,
  MAX_PROXY_BYTES,
  requestContentLength
} from "@/lib/request-guards";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "werd_session";
const PUBLIC_GET_EXACT = ["homepage", "shipping", "settings"];
const PUBLIC_PREFIXES = ["products", "support/ticket"];
const USER_PREFIXES = ["auth/me", "auth/change-password", "cart", "orders", "payments", "coupons/validate", "wishlist", "products", "stock-notify"];
const ADMIN_PREFIXES = ["admin", "support/admin", "settings/admin", "shipping/admin", "coupons/admin"];
const PUBLIC_POST_EXACT = ["support", "newsletter", "stock-notify"];
const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

function isPathAllowed(pathname: string, method: string, hasToken: boolean) {
  const cleanPath = pathname.replace(/^\/+/, "");
  const matches = (prefixes: string[]) => prefixes.some((prefix) => cleanPath === prefix || cleanPath.startsWith(`${prefix}/`));

  if (method === "GET" && PUBLIC_GET_EXACT.includes(cleanPath)) return true;
  if (method === "GET" && matches(PUBLIC_PREFIXES)) return true;
  if (method === "POST" && PUBLIC_POST_EXACT.includes(cleanPath)) return true;
  if (method === "POST" && cleanPath.startsWith("support/ticket/")) return true;
  if (hasToken && matches([...USER_PREFIXES, ...ADMIN_PREFIXES])) return true;
  return false;
}

function sanitizePublicPayload(pathname: string, payload: unknown) {
  if (pathname !== "settings" || !payload || typeof payload !== "object") return payload;
  const data = payload as { settings?: Record<string, unknown> };
  if (!data.settings || typeof data.settings !== "object") return payload;

  const settings = { ...data.settings };
  const embed = String(settings.mapEmbedUrl || "");
  const srcMatch = embed.match(/\ssrc=["']([^"']+)["']/i);
  if (srcMatch?.[1]) {
    settings.mapEmbedUrl = srcMatch[1];
  }
  return { ...data, settings };
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const search = request.nextUrl.search;
  const method = request.method;
  const joinedPath = path.join("/");
  const contentType = request.headers.get("content-type") || "";
  const maxBytes = contentType.includes("multipart/form-data") ? MAX_MULTIPART_BYTES : MAX_PROXY_BYTES;

  if (!ALLOWED_METHODS.has(method)) {
    return hardenJsonResponse(NextResponse.json({ error: "Method not allowed." }, { status: 405 }));
  }

  if (isMutatingMethod(method) && !isAllowedOrigin(request)) {
    return hardenJsonResponse(NextResponse.json({ error: "Invalid request origin." }, { status: 403 }));
  }

  if (!isPathAllowed(joinedPath, method, Boolean(token))) {
    return hardenJsonResponse(NextResponse.json({ error: "Route is not available through this proxy." }, { status: 404 }));
  }

  if (requestContentLength(request) > maxBytes) {
    return hardenJsonResponse(NextResponse.json({ error: "Request body is too large." }, { status: 413 }));
  }

  const rateLimit = checkRateLimit(
    getClientKey(request, joinedPath.startsWith("admin") || joinedPath.includes("/admin") ? "admin-proxy" : "api-proxy"),
    joinedPath.startsWith("admin") || joinedPath.includes("/admin") ? 240 : 90,
    60_000
  );

  if (!rateLimit.allowed) {
    return hardenJsonResponse(NextResponse.json({ error: "Too many requests, please slow down." }, { status: 429 }));
  }

  const body = ["GET", "HEAD"].includes(method) ? undefined : await request.arrayBuffer();

  const headers: HeadersInit = {
    Accept: "application/json"
  };

  if (contentType) headers["Content-Type"] = contentType;
  if (token) headers.Authorization = `Bearer ${token}`;

  const upstream = await fetch(backendPath(`/api/${joinedPath}${search}`), {
    method,
    headers,
    body,
    cache: "no-store"
  }).catch(() => null);

  if (!upstream) {
    return hardenJsonResponse(NextResponse.json({ error: "Backend service is unavailable." }, { status: 503 }));
  }

  const responseContentType = upstream.headers.get("content-type") || "";
  if (responseContentType.includes("application/json")) {
    const payload = await upstream.json().catch(() => ({}));
    return hardenJsonResponse(NextResponse.json(sanitizePublicPayload(joinedPath, payload), { status: upstream.status }));
  }

  return hardenJsonResponse(new NextResponse(await upstream.text(), { status: upstream.status }));
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
