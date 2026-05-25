import { AdminShell } from "@/components/admin-shell";
import { AdminProductForm } from "@/components/admin-product-form";

export default async function AdminEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AdminShell title="">
      <AdminProductForm productId={id} />
    </AdminShell>
  );
}
