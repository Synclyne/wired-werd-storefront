import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hardenJsonResponse, isAllowedOrigin } from "@/lib/request-guards";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "werd_session";

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return hardenJsonResponse(NextResponse.json({ message: "Invalid request origin." }, { status: 403 }));
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  return hardenJsonResponse(response);
}
