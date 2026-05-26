"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { useAuthStatus } from "@/components/auth-status";

export function WishlistButton({ productId, label }: { productId?: string; label?: string }) {
  const { isAuthenticated } = useAuthStatus();
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!productId) return;
    if (!isAuthenticated) {
      setMessage("Login to save this.");
      return;
    }
    setMessage("");
    startTransition(async () => {
      const response = await fetch(`/api/backend/wishlist/${productId}`, { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(payload.error || "Could not update wishlist.");
        return;
      }
      setSaved(payload.action === "added");
      setMessage(payload.action === "added" ? "Saved." : "Removed.");
    });
  }

  return (
    <span className="wishlist-control">
      <button className={saved ? "saved" : ""} type="button" onClick={toggle} disabled={isPending} aria-label={label || "Save to wishlist"}>
        <Heart size={16} fill={saved ? "currentColor" : "none"} />
      </button>
      {message && <em>{message}</em>}
    </span>
  );
}
