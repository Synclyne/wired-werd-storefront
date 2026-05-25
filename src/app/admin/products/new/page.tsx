import { AdminShell } from "@/components/admin-shell";
import { AdminProductForm } from "@/components/admin-product-form";

export default function AdminNewProductPage() {
  return (
    <AdminShell title="">
      <AdminProductForm />
    </AdminShell>
  );
}
