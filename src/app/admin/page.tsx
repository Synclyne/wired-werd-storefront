import { AdminShell } from "@/components/admin-shell";
import { AdminDashboardFunctional } from "@/components/admin-functional";

export default function AdminDashboardPage() {
  return (
    <AdminShell title="">
      <AdminDashboardFunctional />
    </AdminShell>
  );
}
