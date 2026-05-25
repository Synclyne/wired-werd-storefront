import { AdminCards, AdminShell } from "@/components/admin-shell";

export default function AdminStaffPage() {
  return <AdminShell title="Staff"><AdminCards labels={["Admins", "Support agents", "Permissions", "Invites"]} /></AdminShell>;
}
