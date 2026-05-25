import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendPath } from "@/lib/backend";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "werd_session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function assertAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) redirect("/login");

  const response = await fetch(backendPath("/api/auth/me"), {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  }).catch(() => null);

  if (!response?.ok) redirect("/login");

  const payload = await response.json().catch(() => null);
  if (payload?.user?.role !== "admin") redirect("/account");
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await assertAdmin();
  return children;
}
