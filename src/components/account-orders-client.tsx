"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, RotateCcw, XCircle } from "lucide-react";
import { SiteChrome } from "@/components/site-chrome";

type OrderItem = {
  name?: string;
  quantity?: number;
};

type Order = {
  _id: string;
  orderNumber?: string;
  status?: string;
  total?: number;
  createdAt?: string;
  items?: OrderItem[];
};

function money(value?: number) {
  return `KSh ${Number(value || 0).toLocaleString()}`;
}

function formatDate(value?: string) {
  return new Date(value || Date.now()).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function AccountOrdersClient() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetch("/api/backend/orders", { cache: "no-store" })
      .then((response) => {
        if (response.status === 401) {
          router.replace("/login");
          return null;
        }
        return response.ok ? response.json() : null;
      })
      .then((payload) => setOrders(payload?.orders || []))
      .finally(() => setLoading(false));
  }, [router]);

  function reorder(orderId: string) {
    startTransition(async () => {
      const response = await fetch(`/api/backend/orders/${orderId}/reorder`, { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(payload.error || "Could not add order back to cart.");
        return;
      }
      setMessage("Items were added back to your cart.");
      router.refresh();
    });
  }

  function requestCancel(orderId: string) {
    const reason = window.prompt("Why should we cancel this order?");
    if (reason === null) return;
    startTransition(async () => {
      const response = await fetch(`/api/backend/orders/${orderId}/cancel-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(payload.error || "Could not request cancellation.");
        return;
      }
      setOrders((items) => items.map((order) => order._id === orderId ? { ...order, status: payload.order?.status || order.status } : order));
      setMessage("Cancellation request sent.");
    });
  }

  return (
    <SiteChrome>
      <main className="order-confirm-shell account-orders-shell">
        <section className="order-confirm-hero account-orders-hero">
          <div>ORD</div>
          <h1>Order History</h1>
          <p>Track current orders, review receipts, and revisit past purchases.</p>
          <span>{orders.length} saved order{orders.length === 1 ? "" : "s"}</span>
        </section>
        {message && <p className="form-message">{message}</p>}
        {loading && <p className="account-orders-empty">Loading orders...</p>}

        {!loading && orders.length === 0 && (
          <section className="order-confirm-empty">
            <Package />
            <h2>No orders yet</h2>
            <p>After your first checkout, order status, delivery updates, and receipts will live here.</p>
            <Link href="/shop">Start Shopping</Link>
          </section>
        )}

        {!loading && orders.length > 0 && (
          <div className="account-orders-list">
            {orders.map((order) => {
              const itemCount = order.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0;
              return (
                <article className="order-confirm-card account-order-card" key={order._id}>
                  <Link href={`/order-confirmed/${order._id}`}>
                    <span>#{order.orderNumber || order._id.slice(-6).toUpperCase()}</span>
                    <h2>{order.status || "confirmed"}</h2>
                    <p>{itemCount} item{itemCount === 1 ? "" : "s"} / {formatDate(order.createdAt)}</p>
                  </Link>
                  <div>
                    <strong>{money(order.total)}</strong>
                    <div className="account-order-actions">
                      <button type="button" onClick={() => reorder(order._id)} disabled={isPending}><RotateCcw size={14} /> Reorder</button>
                      {["pending", "confirmed", "processing"].includes(order.status || "") && <button type="button" onClick={() => requestCancel(order._id)} disabled={isPending}><XCircle size={14} /> Cancel</button>}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </SiteChrome>
  );
}
