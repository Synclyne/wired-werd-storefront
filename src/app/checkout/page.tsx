import { Suspense } from "react";
import { CheckoutClient } from "@/components/checkout-client";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<main className="checkout-shell"><section className="checkout-empty"><h1>Loading Checkout</h1></section></main>}>
      <CheckoutClient />
    </Suspense>
  );
}
