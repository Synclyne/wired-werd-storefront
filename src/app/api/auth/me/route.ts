import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/backend";
import { hardenJsonResponse } from "@/lib/request-guards";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "werd_session";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return hardenJsonResponse(NextResponse.json({ message: "Not signed in." }, { status: 401 }));
  }

  const upstream = await fetch(backendPath("/api/auth/me"), {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  }).catch(() => null);

  if (!upstream) {
    return hardenJsonResponse(NextResponse.json({ message: "Authentication service is unavailable." }, { status: 503 }));
  }

  const payload = await upstream.json().catch(() => ({}));
  return hardenJsonResponse(NextResponse.json(payload, { status: upstream.status }));
}
