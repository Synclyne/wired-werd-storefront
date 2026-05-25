"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import type { Product } from "@/lib/types";
import { AddToCartButton } from "@/components/cart-provider";
import { PageHero, SiteChrome } from "@/components/site-chrome";

function money(value: number) {
  return `KSh ${Number(value || 0).toLocaleString()}`;
}

export function WishlistClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetch("/api/backend/wishlist", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => setProducts((payload?.products || []).map(normalizeWishlistProduct)))
      .finally(() => setLoading(false));
  }, []);

  function remove(productId: string) {
    startTransition(async () => {
      const response = await fetch(`/api/backend/wishlist/${productId}`, { method: "DELETE" });
      if (response.ok) {
        setProducts((items) => items.filter((item) => item.productId !== productId && item.id !== productId));
        setMessage("Removed from wishlist.");
      } else {
        setMessage("Could not remove that item.");
      }
    });
  }

  return (
    <SiteChrome>
      <PageHero eyebrow="Saved" title="Wishlist" copy="Keep your favorite pieces close before they sell out." />
      <section className="wishlist-panel">
        {loading && <p className="account-orders-empty">Loading wishlist...</p>}
        {!loading && !products.length && (
          <div className="state-panel">
            <Heart />
            <h2>Your wishlist is empty</h2>
            <p>Tap the heart on pieces you love and they will show up here for a faster return to your favorites.</p>
            <Link href="/shop">Shop The Drop</Link>
          </div>
        )}
        {message && <p className="form-message">{message}</p>}
        {!!products.length && (
          <div className="wishlist-grid">
            {products.map((product) => (
              <article className="wishlist-card" key={product.id}>
                <Link href={`/product/${product.slug}`}><img src={product.image} alt={product.name} /></Link>
                <div>
                  <span>{product.category}</span>
                  <h2><Link href={`/product/${product.slug}`}>{product.name}</Link></h2>
                  <strong>{money(product.price)}</strong>
                </div>
                <div>
                  <AddToCartButton product={product}><ShoppingBag size={15} /> Add</AddToCartButton>
                  <button type="button" onClick={() => remove(product.productId || product.id)} disabled={isPending}><Trash2 size={15} /> Remove</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </SiteChrome>
  );
}

function normalizeWishlistProduct(item: any): Product {
  const images = Array.isArray(item.images) ? item.images : [];
  const image = item.image || images.find((entry: any) => entry?.isPrimary)?.url || images[0]?.url || "";
  const variants = Array.isArray(item.variants) ? item.variants : [];
  const firstVariant = variants.find((variant: any) => Number(variant.stock || 0) > 0) || variants[0];
  return {
    id: String(item._id || item.id || item.slug),
    productId: String(item._id || item.id || ""),
    name: String(item.name || "Wishlist item"),
    slug: String(item.slug || item._id || item.id),
    category: String(item.category || "Drop"),
    description: String(item.description || ""),
    price: Number(item.price || 0),
    image,
    badge: String(item.badge || item.category || ""),
    variantId: firstVariant ? String(firstVariant._id || firstVariant.id || "") : undefined,
    size: firstVariant ? String(firstVariant.size || "One Size") : "One Size",
    color: firstVariant ? String(firstVariant.color || "Default") : "Default"
  };
}
