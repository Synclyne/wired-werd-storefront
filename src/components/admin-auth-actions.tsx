"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function AdminAuthActions() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="admin-auth-actions">
      <Link href="/admin">Admin</Link>
      <Link href="/account">Account</Link>
      <button type="button" onClick={logout}>Logout</button>
    </div>
  );
}
