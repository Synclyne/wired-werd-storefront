import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { hardenJsonResponse, isAllowedOrigin, readBoundedJson } from "@/lib/request-guards";
import { backendPath } from "@/lib/backend";

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return hardenJsonResponse(NextResponse.json({ message: "Invalid request origin." }, { status: 403 }));
  }

  const rate = checkRateLimit(getClientKey(request, "newsletter"), 4, 60_000);

  if (!rate.allowed) {
    return hardenJsonResponse(NextResponse.json({ message: "Please wait before subscribing again." }, { status: 429 }));
  }

  const body = await readBoundedJson<{ email?: unknown }>(request);
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return hardenJsonResponse(NextResponse.json({ message: "Enter a valid email address." }, { status: 400 }));
  }

  await fetch(backendPath("/api/newsletter"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({ email }),
    cache: "no-store"
  }).catch(() => null);

  return hardenJsonResponse(NextResponse.json({ ok: true }));
}
