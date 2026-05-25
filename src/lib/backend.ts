const rawBackendUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://hoodie-store-x4hj.onrender.com";

export const BACKEND_URL = rawBackendUrl.replace(/\/$/, "");

export function backendPath(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (BACKEND_URL.endsWith("/api")) return `${BACKEND_URL}${normalizedPath.replace(/^\/api/, "")}`;
  return `${BACKEND_URL}${normalizedPath}`;
}
