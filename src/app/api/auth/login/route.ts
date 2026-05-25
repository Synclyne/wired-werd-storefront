import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { hardenJsonResponse, isAllowedOrigin, readBoundedJson } from "@/lib/request-guards";
import { backendPath } from "@/lib/backend";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "werd_session";

function extractToken(payload: unknown) {
  const data = payload as Record<string, unknown>;
  return data.token || data.accessToken || data.jwt || (data.user as Record<string, unknown> | undefined)?.token;
}

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return hardenJsonResponse(NextResponse.json({ message: "Invalid request origin." }, { status: 403 }));
  }

  const rate = checkRateLimit(getClientKey(request, "login"), 6, 60_000);

  if (!rate.allowed) {
    return hardenJsonResponse(NextResponse.json({ message: "Too many login attempts. Please wait a minute and try again." }, { status: 429 }));
  }

  const body = await readBoundedJson<Record<string, unknown>>(request);

  if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
    return hardenJsonResponse(NextResponse.json({ message: "Invalid login payload." }, { status: 400 }));
  }

  const email = body.email.trim().slice(0, 254);
  const password = body.password.slice(0, 256);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
    return hardenJsonResponse(NextResponse.json({ message: "Invalid email or password." }, { status: 400 }));
  }

  const upstream = await fetch(backendPath("/api/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({ email, password }),
    cache: "no-store"
  }).catch(() => null);

  if (!upstream) {
    return hardenJsonResponse(NextResponse.json({ message: "Authentication service is unavailable." }, { status: 503 }));
  }

  const payload = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    return hardenJsonResponse(NextResponse.json(payload, { status: upstream.status }));
  }

  const response = NextResponse.json({ ok: true, user: (payload as { user?: unknown }).user || null });
  const token = extractToken(payload);
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const host = request.headers.get("host") || "";
  const isLocalhost = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const isHttps = !isLocalhost && (request.nextUrl.protocol === "https:" || forwardedProto === "https");

  if (typeof token === "string" && token.length > 12) {
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });
  }

  return hardenJsonResponse(response);
}
