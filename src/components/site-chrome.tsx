"use client";

import Link from "next/link";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { useAuthStatus } from "@/components/auth-status";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const { itemCount, openCart } = useCart();
  const { user, isAuthenticated } = useAuthStatus();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const accountHref = user?.role === "admin" ? "/admin" : isAuthenticated ? "/account" : "/login";
  const accountLabel = user?.role === "admin" ? "Admin" : isAuthenticated ? "Account" : "Login";
  const whatsappNumber = String(settings?.whatsappNumber || "254700000000").replace(/[^\d]/g, "") || "254700000000";
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hi! I have a question about an order.")}`;

  useEffect(() => {
    let lastY = window.scrollY;

    function onScroll() {
      const currentY = window.scrollY;
      const scrollingDown = currentY > lastY + 5;
      const scrollingUp = currentY < lastY - 5;

      if (currentY < 70 || scrollingUp) setScrolled(false);
      if (currentY > 100 && scrollingDown) setScrolled(true);
      lastY = Math.max(currentY, 0);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetch("/api/backend/settings", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => setSettings(payload?.settings || null))
      .catch(() => null);
  }, []);

  return (
    <main className="commerce-shell">
      {settings?.freeShippingVisible !== false && settings?.freeShippingText && (
        <div className="free-shipping-bar">{settings.freeShippingText}</div>
      )}
      {children}
      <nav className={`floating-nav visible ${scrolled && !menuOpen ? "scrolled" : ""}`} aria-label="Floating navigation" onPointerDown={() => setScrolled(false)}>
        <div className="dock-actions">
          <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Close menu" : "Open menu"}><Menu size={16} /></button>
        </div>
        <Link href="/shop">Shop</Link>
        <Link href="/shop/streetwear">
          <span className="dock-label-full">Collections</span>
          <span className="dock-label-short">Drops</span>
        </Link>
        <Link className="floating-brand" href="/">Werd</Link>
        <Link href={accountHref}>{accountLabel}</Link>
        <ThemeToggle />
        <button className="floating-cart-action cart-button" type="button" onClick={openCart} aria-label={`${itemCount} items in cart`}><ShoppingBag size={16} />{itemCount > 0 && <span>{itemCount}</span>}</button>
      </nav>
      <aside className={`drawer ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen}>
        <button className="icon-button" type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={18} /></button>
        <Link href="/shop" onClick={() => setMenuOpen(false)}>Shop</Link>
        <Link href="/wishlist" onClick={() => setMenuOpen(false)}>Wishlist</Link>
        <Link href="/support" onClick={() => setMenuOpen(false)}>Support</Link>
        {settings?.policyLinks?.shipping && <Link href={settings.policyLinks.shipping} onClick={() => setMenuOpen(false)}>Shipping</Link>}
        {settings?.policyLinks?.returns && <Link href={settings.policyLinks.returns} onClick={() => setMenuOpen(false)}>Returns</Link>}
        <Link href={accountHref} onClick={() => setMenuOpen(false)}>{accountLabel}</Link>
      </aside>
      <a className="whatsapp-float" href={whatsappHref} target="_blank" rel="noreferrer" title="Chat on WhatsApp" aria-label="Chat on WhatsApp">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </main>
  );
}

export function PageHero({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <section className="page-hero">
      <p>{eyebrow}</p>
      <h1>{title}</h1>
      <span>{copy}</span>
    </section>
  );
}
