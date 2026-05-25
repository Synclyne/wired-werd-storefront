import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { cleanText, hardenJsonResponse, isAllowedOrigin, readBoundedJson } from "@/lib/request-guards";
import { backendPath } from "@/lib/backend";

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return hardenJsonResponse(NextResponse.json({ message: "Invalid request origin." }, { status: 403 }));
  }

  const rate = checkRateLimit(getClientKey(request, "support"), 5, 60_000);
  if (!rate.allowed) {
    return hardenJsonResponse(NextResponse.json({ message: "Please wait before sending another support message." }, { status: 429 }));
  }

  const body = await readBoundedJson<Record<string, unknown>>(request);
  const payload = {
    name: cleanText(body?.name, 120),
    email: cleanText(body?.email, 254).toLowerCase(),
    phone: cleanText(body?.phone, 40),
    orderNumber: cleanText(body?.orderNumber, 80),
    subject: cleanText(body?.subject, 160),
    message: cleanText(body?.message, 2000)
  };

  if (!payload.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email) || !payload.subject || !payload.message) {
    return hardenJsonResponse(NextResponse.json({ message: "Name, email, subject, and message are required." }, { status: 400 }));
  }

  const upstream = await fetch(backendPath("/api/support"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  }).catch(() => null);

  if (!upstream) {
    return hardenJsonResponse(NextResponse.json({ message: "Support service is unavailable." }, { status: 503 }));
  }

  const responseBody = await upstream.json().catch(() => ({}));
  return hardenJsonResponse(NextResponse.json(responseBody, { status: upstream.status }));
}
