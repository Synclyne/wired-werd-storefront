import { AdminSettingsFunctional } from "@/components/admin-functional";
import { AdminShell } from "@/components/admin-shell";

export default function AdminSettingsPage() {
  return (
    <AdminShell title="">
      <AdminSettingsFunctional />
    </AdminShell>
  );
}
