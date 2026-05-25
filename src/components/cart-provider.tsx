"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import type { Product } from "@/lib/types";

type CartLine = Product & {
  quantity: number;
};

type CartContextValue = {
  items: CartLine[];
  itemCount: number;
  subtotal: number;
  openCart: () => void;
  addItem: (product: Product) => Promise<void>;
  updateQuantity: (id: string, direction: 1 | -1) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("werd_cart");
    if (saved) setItems(JSON.parse(saved) as CartLine[]);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("werd_cart", JSON.stringify(items));
  }, [items]);

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

  const value = useMemo<CartContextValue>(() => ({
    items,
    itemCount,
    subtotal,
    openCart: () => setOpen(true),
    addItem: async (product) => {
      if (product.productId && product.variantId) {
        await fetch("/api/cart/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.productId, variantId: product.variantId, quantity: 1 })
        }).catch(() => null);
      }

      setItems((current) => {
        const existing = current.find((item) => item.id === product.id && item.variantId === product.variantId);
        if (existing) {
          return current.map((item) => (item.id === existing.id && item.variantId === existing.variantId ? { ...item, quantity: Math.min(item.quantity + 1, 10) } : item));
        }
        return [...current, { ...product, quantity: 1 }];
      });
      setOpen(true);
    },
    updateQuantity: (id, direction) => {
      setItems((current) => current.map((item) => (item.id === id ? { ...item, quantity: item.quantity + direction } : item)).filter((item) => item.quantity > 0));
    },
    removeItem: (id) => setItems((current) => current.filter((item) => item.id !== id)),
    clearCart: () => setItems([])
  }), [itemCount, items, subtotal]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <aside className={`global-cart ${open ? "open" : ""}`} aria-hidden={!open}>
        <div>
          <button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label="Close cart">
            <X size={18} />
          </button>
          <ShoppingBag size={23} />
          <h2>Your Cart</h2>
          {items.length === 0 ? (
            <p className="empty-cart">Your bag is empty. The next piece starts in the shop.</p>
          ) : (
            <>
              <div className="cart-lines">
                {items.map((item) => (
                  <article className="cart-line" key={`${item.id}-${item.variantId || "default"}`}>
                    <img src={item.image} alt={item.name} />
                    <div>
                      <h3>{item.name}</h3>
                      <p>{[item.size, item.color].filter(Boolean).join(" / ") || item.category}</p>
                      <strong>{formatCurrency(item.price)}</strong>
                      <div className="quantity-controls">
                        <button type="button" onClick={() => value.updateQuantity(item.id, -1)} aria-label={`Decrease ${item.name} quantity`}><Minus size={14} /></button>
                        <span>{item.quantity}</span>
                        <button type="button" onClick={() => value.updateQuantity(item.id, 1)} aria-label={`Increase ${item.name} quantity`}><Plus size={14} /></button>
                        <button type="button" onClick={() => value.removeItem(item.id)} aria-label={`Remove ${item.name}`}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <div className="cart-summary">
                <span>Subtotal</span>
                <strong>{formatCurrency(subtotal)}</strong>
              </div>
              <a className="checkout-button" href="/checkout">Secure Checkout</a>
            </>
          )}
        </div>
      </aside>
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}

export function AddToCartButton({ product, children, className, ariaLabel }: { product: Product; children?: React.ReactNode; className?: string; ariaLabel?: string }) {
  const { addItem } = useCart();
  return (
    <button className={className} type="button" onClick={() => void addItem(product)} aria-label={ariaLabel}>
      {children || "Add To Cart"}
    </button>
  );
}
