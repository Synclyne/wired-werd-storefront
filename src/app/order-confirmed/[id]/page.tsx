import { OrderConfirmedClient } from "@/components/order-confirmed-client";

export default async function OrderConfirmedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderConfirmedClient id={id} />;
}
