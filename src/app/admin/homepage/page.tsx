import { AdminHomepageFunctional } from "@/components/admin-functional";
import { AdminShell } from "@/components/admin-shell";

export default function AdminHomepagePage() {
  return (
    <AdminShell title="">
      <AdminHomepageFunctional />
    </AdminShell>
  );
}
