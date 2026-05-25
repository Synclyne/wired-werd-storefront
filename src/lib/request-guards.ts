import { NextRequest } from "next/server";

const MAX_JSON_BYTES = 16_384;
export const MAX_PROXY_BYTES = 10 * 1024 * 1024;
export const MAX_MULTIPART_BYTES = 12 * 1024 * 1024;

export function isAllowedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host) return true;

  try {
    const parsed = new URL(origin);
    return parsed.host === host;
  } catch {
    return false;
  }
}

export async function readBoundedJson<T>(request: NextRequest): Promise<T | null> {
  const length = Number(request.headers.get("content-length") || 0);

  if (length > MAX_JSON_BYTES) return null;
  return request.json().catch(() => null) as Promise<T | null>;
}

export function cleanText(value: unknown, maxLength = 500) {
  return String(value || "").trim().slice(0, maxLength);
}

export function requestContentLength(request: NextRequest) {
  return Number(request.headers.get("content-length") || 0);
}

export function isMutatingMethod(method: string) {
  return !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}

export function hardenJsonResponse(response: Response) {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}
