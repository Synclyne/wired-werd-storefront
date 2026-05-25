export async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/backend${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers
    }
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || payload.message || "Request failed.");
  }
  return payload as T;
}

export const money = (value: number | string | undefined | null) => `KSh ${Number(value || 0).toLocaleString()}`;
