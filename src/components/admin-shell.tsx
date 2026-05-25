import Link from "next/link";
import { AdminAuthActions } from "@/components/admin-auth-actions";
import { adminRoutes } from "@/lib/page-data";

export function AdminShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="admin-shell">
      <aside className="admin-rail">
        <Link href="/" className="commerce-brand">Werd</Link>
        <AdminAuthActions />
        <nav aria-label="Admin navigation">
          {adminRoutes.map((route) => {
            const Icon = route.icon;
            return (
              <Link href={route.href} key={route.href}>
                <Icon size={17} />
                {route.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <section className="admin-main">
        {title ? (
          <div className="admin-heading">
            <p>Admin Console</p>
            <h1>{title}</h1>
          </div>
        ) : null}
        {children}
      </section>
    </main>
  );
}

export function AdminCards({ labels }: { labels: string[] }) {
  return (
    <div className="admin-grid">
      {labels.map((label, index) => (
        <article className="admin-card" key={label}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <h2>{label}</h2>
          <p>Review performance, keep the catalog sharp, and move store operations forward.</p>
        </article>
      ))}
    </div>
  );
}
