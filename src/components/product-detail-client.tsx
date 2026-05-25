"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Ruler, ShoppingBag, Star, X } from "lucide-react";
import type { Product } from "@/lib/types";
import { AddToCartButton } from "@/components/cart-provider";
import { WishlistButton } from "@/components/wishlist-button";

function money(value: number) {
  return `KSh ${Number(value || 0).toLocaleString()}`;
}

export function ProductDetailClient({ product }: { product: Product }) {
  const variants = product.variants || [];
  const [size, setSize] = useState(product.size || variants[0]?.size || "One Size");
  const [color, setColor] = useState(product.color || variants[0]?.color || "Default");
  const [showGuide, setShowGuide] = useState(false);
  const [notice, setNotice] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedVariant = useMemo(() => (
    variants.find((variant) => variant.size === size && variant.color === color) ||
    variants.find((variant) => variant.size === size) ||
    variants[0]
  ), [color, size, variants]);
  const selectedProduct = { ...product, size, color, variantId: selectedVariant?._id || selectedVariant?.id || product.variantId };
  const images = product.images?.length ? product.images : [{ url: product.image, alt: product.name }];
  const sizes = product.sizes?.length ? product.sizes : [...new Set(variants.map((variant) => variant.size).filter(Boolean))];
  const colors = product.colors?.length ? product.colors : [...new Set(variants.map((variant) => variant.color).filter(Boolean))];
  const inStock = !variants.length || Number(selectedVariant?.stock || 0) > 0;

  function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product.productId) return;
    const form = new FormData(event.currentTarget);
    setReviewMessage("");
    startTransition(async () => {
      const response = await fetch(`/api/backend/products/${product.productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: Number(form.get("rating")), comment: form.get("comment") })
      });
      const payload = await response.json().catch(() => ({}));
      setReviewMessage(response.ok ? payload.message || "Review submitted for approval." : payload.error || "Login to leave a review.");
    });
  }

  function stockNotify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product.productId) return;
    const form = new FormData(event.currentTarget);
    setNotice("");
    startTransition(async () => {
      const response = await fetch("/api/backend/stock-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.productId,
          variantId: selectedProduct.variantId,
          email: form.get("email"),
          name: form.get("name")
        })
      });
      const payload = await response.json().catch(() => ({}));
      setNotice(response.ok ? payload.message || "You are on the restock list." : payload.error || "Could not save notification.");
    });
  }

  return (
    <section className="product-detail upgraded-product-detail">
      <Link href="/shop" className="back-link"><ArrowLeft size={16} /> Back to shop</Link>
      <div className="product-media product-gallery">
        <img src={images[0]?.url || product.image} alt={images[0]?.alt || product.name} />
        {images.slice(1, 4).map((image) => <img src={image.url} alt={image.alt || product.name} key={image.url} />)}
      </div>
      <div className="product-buybox">
        <span>{product.category} / {product.gender || "unisex"}</span>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <div className="rating-row"><Star size={17} fill="currentColor" /> {product.rating ? `${product.rating.toFixed(1)} / ${product.numReviews || 0} reviews` : "No reviews yet"}</div>
        <strong>{money(product.price)} {product.comparePrice ? <s>{money(product.comparePrice)}</s> : null}</strong>

        {!!sizes.length && <ChoiceGroup label="Size" items={sizes} active={size} onSelect={setSize} />}
        {!!colors.length && <ChoiceGroup label="Color" items={colors} active={color} onSelect={setColor} />}

        <div className="product-action-row">
          <AddToCartButton product={selectedProduct} ariaLabel={`Add ${product.name} to cart`}><ShoppingBag size={17} /> Add To Cart</AddToCartButton>
          <WishlistButton productId={product.productId || product.id} label={`Save ${product.name}`} />
        </div>
        <button className="size-guide-trigger" type="button" onClick={() => setShowGuide(true)}><Ruler size={15} /> Size Guide</button>
        {!inStock && (
          <form className="stock-notify-form" onSubmit={stockNotify}>
            <h2><Bell size={15} /> Restock Alert</h2>
            <input name="name" placeholder="Name" />
            <input name="email" type="email" placeholder="Email" required />
            <button type="submit" disabled={isPending}>Notify Me</button>
            {notice && <p>{notice}</p>}
          </form>
        )}
      </div>

      <section className="product-review-panel">
        <div>
          <h2>Reviews</h2>
          {product.reviews?.length ? product.reviews.map((review) => (
            <article key={review._id || review.comment}>
              <strong>{"★".repeat(Math.round(review.rating))}{"☆".repeat(Math.max(0, 5 - Math.round(review.rating)))}</strong>
              <p>{review.comment}</p>
              <span>{review.name || "Customer"}</span>
            </article>
          )) : <p>No reviews yet. Be the first once you have tried it.</p>}
        </div>
        <form onSubmit={submitReview}>
          <h2>Leave a review</h2>
          <select name="rating" defaultValue="5">
            {[5, 4, 3, 2, 1].map((rating) => <option value={rating} key={rating}>{rating} stars</option>)}
          </select>
          <textarea name="comment" placeholder="Tell us about the fit and quality..." rows={4} required />
          <button type="submit" disabled={isPending}>Submit Review</button>
          {reviewMessage && <p>{reviewMessage}</p>}
        </form>
      </section>

      {showGuide && <SizeGuide category={product.category} onClose={() => setShowGuide(false)} />}
    </section>
  );
}

function ChoiceGroup({ label, items, active, onSelect }: { label: string; items: string[]; active: string; onSelect: (value: string) => void }) {
  return (
    <div className="product-choice-group">
      <p>{label}</p>
      <div>
        {items.map((item) => <button className={item === active ? "active" : ""} type="button" key={item} onClick={() => onSelect(item)}>{item}</button>)}
      </div>
    </div>
  );
}

function SizeGuide({ category, onClose }: { category: string; onClose: () => void }) {
  const shoe = category.toLowerCase().includes("shoe");
  const rows = shoe ? [["EU", "40", "41", "42", "43", "44"], ["US", "7", "8", "9", "10", "11"]] : [["Size", "S", "M", "L", "XL", "XXL"], ["Chest", "36", "40", "44", "48", "52"]];
  return (
    <div className="size-guide-modal" role="dialog" aria-modal="true">
      <div>
        <button type="button" onClick={onClose} aria-label="Close size guide"><X size={18} /></button>
        <h2>Size Guide</h2>
        <p>{shoe ? "Use your usual sneaker size. If between sizes, go up." : "Our hoodies lean relaxed. Size down for a fitted look."}</p>
        <table>
          <tbody>{rows.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
