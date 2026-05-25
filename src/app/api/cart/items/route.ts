import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/backend";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { hardenJsonResponse, isAllowedOrigin, readBoundedJson } from "@/lib/request-guards";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "werd_session";

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return hardenJsonResponse(NextResponse.json({ message: "Invalid request origin." }, { status: 403 }));
  }

  const rate = checkRateLimit(getClientKey(request, "cart-add"), 30, 60_000);
  if (!rate.allowed) {
    return hardenJsonResponse(NextResponse.json({ message: "Please wait before adding more items." }, { status: 429 }));
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const body = await readBoundedJson<{ productId?: string; variantId?: string; quantity?: number }>(request);

  if (!body?.productId || !body.variantId) {
    return hardenJsonResponse(NextResponse.json({ message: "Choose an available size and color before adding this item." }, { status: 400 }));
  }

  if (!token) {
    return hardenJsonResponse(NextResponse.json({ message: "Guest cart only.", guest: true }, { status: 202 }));
  }

  const upstream = await fetch(backendPath("/api/cart/items"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      productId: body.productId,
      variantId: body.variantId,
      quantity: Math.min(Math.max(Number(body.quantity || 1), 1), 10)
    }),
    cache: "no-store"
  }).catch(() => null);

  if (!upstream) {
    return hardenJsonResponse(NextResponse.json({ message: "Cart service is unavailable.", guest: true }, { status: 202 }));
  }

  const payload = await upstream.json().catch(() => ({}));
  return hardenJsonResponse(NextResponse.json(payload, { status: upstream.status }));
}
