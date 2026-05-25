"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteChrome } from "@/components/site-chrome";

type Order = any;
const steps = ["confirmed", "processing", "shipped", "delivered"];
const fmt = (value: number) => `KSh ${Number(value || 0).toLocaleString()}`;

export function OrderConfirmedClient({ id }: { id: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/backend/orders/${id}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => setOrder(payload?.order || null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <SiteChrome><main className="order-confirm-shell"><section className="order-confirm-empty">Loading order...</section></main></SiteChrome>;
  if (!order) return <SiteChrome><main className="order-confirm-shell"><section className="order-confirm-empty"><h1>Order Not Found</h1><Link href="/account/orders">My Orders</Link></section></main></SiteChrome>;

  const currentStep = Math.max(0, steps.indexOf(order.status));

  return (
    <SiteChrome>
      <main className="order-confirm-shell">
        <section className="order-confirm-hero">
          <div>OK</div>
          <h1>Order Confirmed</h1>
          <p>Order <strong>#{order.orderNumber || id}</strong></p>
          <span>{new Date(order.createdAt || Date.now()).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
        </section>
        <section className="order-confirm-card">
          <h2>Order Status</h2>
          <div className="order-steps">
            {steps.map((step, index) => <div className={index <= currentStep ? "active" : ""} key={step}><span>{index < currentStep ? "OK" : index + 1}</span><p>{step}</p></div>)}
          </div>
        </section>
        <section className="order-confirm-card">
          <h2>Items Ordered</h2>
          <div className="order-items">
            {order.items?.map((item: any, index: number) => <article key={index}><img src={item.image || ""} alt="" /><div><strong>{item.name}</strong><p>{item.size} / {item.color} x{item.quantity}</p></div><span>{fmt(item.price * item.quantity)}</span></article>)}
          </div>
          <div className="order-totals">
            <p><span>Subtotal</span><strong>{fmt(order.subtotal)}</strong></p>
            <p><span>Shipping</span><strong>{order.shipping === 0 ? "Free" : fmt(order.shipping)}</strong></p>
            {!!order.discount && <p><span>Discount</span><strong>-{fmt(order.discount)}</strong></p>}
            <p><span>Total</span><strong>{fmt(order.total)}</strong></p>
          </div>
        </section>
        <section className="order-confirm-card">
          <h2>Shipping To</h2>
          <p><strong>{order.shippingAddress?.fullName}</strong></p>
          <p>{order.shippingAddress?.line1}{order.shippingAddress?.line2 ? `, ${order.shippingAddress.line2}` : ""}</p>
          <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}</p>
          <p>{order.shippingAddress?.country} / {order.shippingAddress?.phone}</p>
        </section>
        <div className="order-confirm-actions"><Link href="/account/orders">View All Orders</Link><Link href="/shop">Continue Shopping</Link></div>
      </main>
    </SiteChrome>
  );
}
