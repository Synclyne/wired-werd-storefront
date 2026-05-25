"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/components/cart-provider";

type Address = {
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
};

type ShippingZone = {
  _id: string;
  name: string;
  regions?: string[];
  price: number;
  freeOver?: number;
};

type Pricing = {
  subtotal: number;
  shipping: number;
  discount?: number;
  tax?: number;
  total: number;
};

const emptyAddress: Address = {
  fullName: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "KE",
  phone: ""
};

function fmt(value: number) {
  return `KSh ${Number(value || 0).toLocaleString()}`;
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/backend${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || payload.message || "Request failed.");
  return payload as T;
}

export function CheckoutClient() {
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [note, setNote] = useState("");
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [zoneId, setZoneId] = useState("");
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [processing, setProcessing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ zones: ShippingZone[] }>("/shipping").then((data) => setShippingZones(data.zones || [])).catch(() => null);
  }, []);

  const syncBackendCart = useCallback(async () => {
    if (!items.length) throw new Error("Your cart is empty.");
    if (items.some((item) => !item.productId || !item.variantId)) {
      throw new Error("One of these products is missing backend variant data. Re-add it from the shop.");
    }
    await api("/cart", { method: "DELETE" });
    for (const item of items) {
      await api("/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId: item.productId, variantId: item.variantId, quantity: item.quantity })
      });
    }
  }, [items]);

  const verifyPayment = useCallback(async (transactionId: string, txRef: string) => {
    setVerifying(true);
    setError("");
    try {
      const savedAddress = JSON.parse(sessionStorage.getItem("werd_checkout_address") || "null");
      if (!savedAddress) throw new Error("Session expired. Please restart checkout.");
      const data = await api<{ order: { _id: string } }>("/payments/verify", {
        method: "POST",
        body: JSON.stringify({
          transaction_id: transactionId,
          tx_ref: txRef,
          shippingAddress: savedAddress,
          customerNote: sessionStorage.getItem("werd_checkout_note") || "",
          couponCode: sessionStorage.getItem("werd_checkout_coupon") || "",
          shippingZoneId: sessionStorage.getItem("werd_checkout_zone") || undefined
        })
      });
      clearCheckoutSession();
      clearCart();
      router.replace(`/order-confirmed/${data.order._id}`);
    } catch (err: any) {
      setError(err.message || "Payment verification failed. Please contact support.");
      setVerifying(false);
    }
  }, [clearCart, router]);

  useEffect(() => {
    const transactionId = searchParams.get("transaction_id");
    const txRef = searchParams.get("tx_ref");
    const status = searchParams.get("status");
    if (transactionId && txRef) {
      if (status === "cancelled") {
        setError("Payment was cancelled. You can try again.");
        return;
      }
      void verifyPayment(transactionId, txRef);
    }
  }, [searchParams, verifyPayment]);

  function currentPricing(): Pricing {
    const selectedZone = shippingZones.find((zone) => zone._id === zoneId);
    const zoneShipping = selectedZone ? ((selectedZone.freeOver || 0) && subtotal >= (selectedZone.freeOver || 0) ? 0 : selectedZone.price) : 0;
    const discount = couponResult?.discount || 0;
    return pricing || { subtotal, shipping: zoneShipping, discount, total: Math.max(0, subtotal + zoneShipping - discount) };
  }

  function validateDelivery() {
    if (shippingZones.length && !zoneId) return "Please select a delivery zone.";
    if (!address.fullName || !address.phone || !address.line1 || !address.city || !address.state) return "Please complete your delivery details.";
    return "";
  }

  async function prepareReview(event: FormEvent) {
    event.preventDefault();
    setError("");
    setProcessing(true);
    try {
      const deliveryError = validateDelivery();
      if (deliveryError) throw new Error(deliveryError);
      await syncBackendCart();
      setPricing(currentPricing());
      saveCheckoutSession(address, note, couponResult?.code || "", zoneId);
      setStep(1);
      window.scrollTo(0, 0);
    } catch (err: any) {
      setError(err.message || "Failed to prepare payment.");
    } finally {
      setProcessing(false);
    }
  }

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setCouponError("");
    try {
      const data = await api<any>("/coupons/validate", {
        method: "POST",
        body: JSON.stringify({ code: couponCode, cartTotal: subtotal })
      });
      setCouponResult(data);
      setPricing((current) => {
        const base = current || currentPricing();
        const discount = Number(data.discount || 0);
        return { ...base, discount, total: Math.max(0, base.subtotal + base.shipping - discount) };
      });
    } catch (err: any) {
      setCouponError(err.message || "Invalid code.");
      setCouponResult(null);
    }
  }

  async function pay() {
    setError("");
    setProcessing(true);
    try {
      const deliveryError = validateDelivery();
      if (deliveryError) throw new Error(deliveryError);
      await syncBackendCart();
      const data = await api<any>("/payments/initiate", {
        method: "POST",
        body: JSON.stringify({
          shippingAddress: address,
          customerNote: note,
          couponCode: couponResult?.code || "",
          shippingZoneId: zoneId || undefined,
          paymentMethod
        })
      });
      if (paymentMethod === "cod") {
        clearCheckoutSession();
        clearCart();
        router.replace(`/order-confirmed/${data.orderId || data.order?._id}`);
        return;
      }
      const paymentLink = data.paymentLink || data?.data?.link || data?.link || data?.data;
      if (!paymentLink) throw new Error("Failed to generate payment link.");
      saveCheckoutSession(address, note, couponResult?.code || "", zoneId);
      window.location.assign(paymentLink);
    } catch (err: any) {
      setError(err.message || "Could not launch payment.");
      setProcessing(false);
    }
  }

  const p = currentPricing();

  if (verifying) {
    return <main className="checkout-shell"><section className="checkout-empty"><h1>Verifying payment</h1><p>Please hold tight while we confirm your order.</p></section></main>;
  }

  if (!items.length && !searchParams.get("transaction_id")) {
    return <main className="checkout-shell"><section className="checkout-empty"><h1>Your Cart Is Empty</h1><Link href="/shop">Shop Now</Link></section></main>;
  }

  return (
    <main className="checkout-shell">
      <section className="checkout-header">
        <Link href="/">Werd</Link>
        <div>{["Address", "Review & Pay"].map((label, index) => <span className={index === step ? "active" : ""} key={label}>{label}</span>)}</div>
      </section>
      {error && <div className="checkout-error">{error}</div>}
      <section className="checkout-layout">
        <div className="checkout-panel">
          {step === 0 ? (
            <form onSubmit={prepareReview}>
              <h1>Delivery Details</h1>
              <div className="checkout-form-grid">
                <Field label="Full Name" value={address.fullName} onChange={(value) => setAddress({ ...address, fullName: value })} />
                <Field label="Phone" value={address.phone} onChange={(value) => setAddress({ ...address, phone: value })} />
                <Field label="Address Line 1" value={address.line1} onChange={(value) => setAddress({ ...address, line1: value })} />
                <Field label="Address Line 2" value={address.line2} onChange={(value) => setAddress({ ...address, line2: value })} />
                <Field label="City" value={address.city} onChange={(value) => setAddress({ ...address, city: value })} />
                <Field label="State / County" value={address.state} onChange={(value) => setAddress({ ...address, state: value })} />
                <Field label="Postal Code" value={address.postalCode} onChange={(value) => setAddress({ ...address, postalCode: value })} />
                <label><span>Country</span><select value={address.country} onChange={(event) => setAddress({ ...address, country: event.target.value })}><option value="KE">Kenya</option><option value="UG">Uganda</option><option value="TZ">Tanzania</option><option value="RW">Rwanda</option><option value="US">United States</option></select></label>
              </div>
              {shippingZones.length > 0 && (
                <div className="checkout-zone-list">
                  <h2>Delivery Zone Required</h2>
                  {shippingZones.map((zone) => <button type="button" className={zoneId === zone._id ? "active" : ""} onClick={() => setZoneId(zone._id)} key={zone._id}><span>{zone.name}{zone.regions?.length ? ` / ${zone.regions.join(", ")}` : ""}</span><strong>{zone.price === 0 ? "Free" : fmt(zone.price)}</strong></button>)}
                </div>
              )}
              <label><span>Order Note</span><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} placeholder="Special instructions..." /></label>
              <button className="checkout-primary" disabled={processing}>{processing ? "Loading..." : "Review Order"}</button>
            </form>
          ) : (
            <section className="checkout-review">
              <h1>Review & Pay</h1>
              <div className="checkout-address-card"><strong>Shipping to:</strong><p>{address.fullName}, {address.line1}, {address.city}, {address.state}</p><p>{address.phone}</p><button type="button" onClick={() => setStep(0)}>Edit address</button></div>
              <label><span>Promo Code</span><div className="checkout-coupon"><input value={couponCode} disabled={!!couponResult} onChange={(event) => { setCouponCode(event.target.value.toUpperCase()); setCouponError(""); setCouponResult(null); }} placeholder="ENTER CODE" />{couponResult ? <button type="button" onClick={() => { setCouponResult(null); setCouponCode(""); setPricing((current) => current ? { ...current, discount: 0, total: current.subtotal + current.shipping } : current); }}>Remove</button> : <button type="button" onClick={applyCoupon}>Apply</button>}</div></label>
              {couponError && <p className="checkout-error">{couponError}</p>}
              {couponResult && <p className="checkout-success">{couponResult.description || `${couponResult.code} saves ${fmt(couponResult.discount)}`}</p>}
              <div className="checkout-pay-methods">
                <PaymentMethod active={paymentMethod === "card"} onClick={() => setPaymentMethod("card")} title="Card / M-Pesa" copy="Visa, Mastercard, M-Pesa, Airtel Money via Flutterwave" />
                <PaymentMethod active={paymentMethod === "cod"} onClick={() => setPaymentMethod("cod")} title="Cash on Delivery" copy="Pay when your order arrives" />
              </div>
              <button className="checkout-primary" type="button" disabled={processing} onClick={pay}>{processing ? "Processing..." : paymentMethod === "cod" ? `Place Order - ${fmt(p.total)}` : `Pay ${fmt(p.total)}`}</button>
            </section>
          )}
        </div>
        <OrderSummary pricing={p} items={items} />
      </section>
    </main>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label><span>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function PaymentMethod({ active, title, copy, onClick }: { active: boolean; title: string; copy: string; onClick: () => void }) {
  return <button type="button" className={active ? "active" : ""} onClick={onClick}><strong>{title}</strong><span>{copy}</span></button>;
}

function OrderSummary({ pricing, items }: { pricing: Pricing; items: any[] }) {
  return (
    <aside className="checkout-summary">
      <h2>Order Summary</h2>
      {items.map((item) => <article key={`${item.id}-${item.variantId}`}><img src={item.image} alt={item.name} /><div><strong>{item.name}</strong><p>{[item.size, item.color].filter(Boolean).join(" / ")}</p></div><span>{fmt(item.price * item.quantity)}</span></article>)}
      <div className="checkout-totals">
        <p><span>Subtotal</span><strong>{fmt(pricing.subtotal)}</strong></p>
        <p><span>Shipping</span><strong>{pricing.shipping === 0 ? "Free" : fmt(pricing.shipping)}</strong></p>
        {!!pricing.discount && <p><span>Discount</span><strong>-{fmt(pricing.discount)}</strong></p>}
        <p><span>Total</span><strong>{fmt(pricing.total)}</strong></p>
      </div>
    </aside>
  );
}

function saveCheckoutSession(address: Address, note: string, coupon: string, zoneId: string) {
  sessionStorage.setItem("werd_checkout_address", JSON.stringify(address));
  sessionStorage.setItem("werd_checkout_note", note);
  sessionStorage.setItem("werd_checkout_coupon", coupon);
  sessionStorage.setItem("werd_checkout_zone", zoneId);
}

function clearCheckoutSession() {
  sessionStorage.removeItem("werd_checkout_address");
  sessionStorage.removeItem("werd_checkout_note");
  sessionStorage.removeItem("werd_checkout_coupon");
  sessionStorage.removeItem("werd_checkout_zone");
}
