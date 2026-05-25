"use client";

import { useEffect, useState } from "react";

type AuthUser = {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  sizePreferences?: {
    top?: string;
    bottom?: string;
    shoe?: string;
    color?: string;
  };
};

export function useAuthStatus() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (active) setUser(payload?.user || null);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { user, loading, isAuthenticated: !!user };
}
