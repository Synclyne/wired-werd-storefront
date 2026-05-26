"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch, money } from "@/lib/admin-client";

type Product = {
  _id: string;
  name: string;
  slug: string;
  category: string;
  gender: string;
  price: number;
  comparePrice?: number;
  totalStock?: number;
  isPublished: boolean;
  images?: { url: string }[];
};

type Order = {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  discount?: number;
  createdAt: string;
  trackingNumber?: string;
  trackingCarrier?: string;
  adminNote?: string;
  user?: { firstName?: string; lastName?: string; email?: string };
  shippingAddress?: { fullName?: string; phone?: string; city?: string; state?: string; line1?: string; country?: string };
  items: { name: string; quantity: number; price: number; size?: string; color?: string }[];
};

type Coupon = {
  _id: string;
  code: string;
  type: string;
  value: number;
  minOrder?: number;
  maxUses?: number;
  usedCount?: number;
  expiresAt?: string;
  description?: string;
  onePerUser?: boolean;
  isActive: boolean;
};

type Zone = {
  _id: string;
  name: string;
  regions?: string[];
  price: number;
  freeOver?: number;
  minDays: number;
  maxDays: number;
  isActive: boolean;
  sortOrder: number;
};

type MediaAsset = {
  _id: string;
  url: string;
  originalName?: string;
  source?: string;
  size?: number;
};

type ReviewItem = {
  productId: string;
  productName: string;
  productSlug: string;
  review: {
    _id: string;
    name?: string;
    rating: number;
    comment: string;
    approved?: boolean;
    createdAt?: string;
    user?: { email?: string; firstName?: string; lastName?: string };
  };
};

type StoreSettings = {
  storeName: string;
  logoUrl?: string;
  supportEmail?: string;
  whatsappNumber?: string;
  currencyCode?: string;
  currencyLabel?: string;
  freeShippingVisible?: boolean;
  freeShippingText?: string;
  locationName?: string;
  locationAddress?: string;
  mapEmbedUrl?: string;
  socialLinks?: Record<string, string>;
  policyLinks?: Record<string, string>;
};

type SupportMessage = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  orderNumber?: string;
  subject: string;
  message: string;
  status: string;
  adminNote?: string;
  createdAt: string;
  thread?: Array<{ _id?: string; author: string; body: string; createdAt: string; emailed?: boolean }>;
};

type HomepageConfig = {
  siteBackgroundColor?: string;
  siteBackgroundImage?: string;
  announcementText?: string;
  announcementVisible?: boolean;
  heroTagline?: string;
  heroTitle?: string;
  heroCtaLabel?: string;
  heroCtaLink?: string;
  heroSlides?: Array<{
    tagline?: string;
    title?: string;
    ctaLabel?: string;
    ctaLink?: string;
    category?: string;
    imageUrl?: string;
    bgColor?: string;
    darkText?: boolean;
  }>;
  tickerText?: string;
  tickerVisible?: boolean;
  featuredCards?: Array<{ title?: string; category?: string; bg?: string; imageUrl?: string; dark?: boolean }>;
  collectionTitle?: string;
  collectionSubtext?: string;
  banner?: {
    heading?: string;
    subheading?: string;
    ctaLabel?: string;
    ctaLink?: string;
    bgLeft?: string;
    bgRight?: string;
    imageUrlLeft?: string;
    imageUrlRight?: string;
  };
  sectionOrder?: string[];
  buyTheFits?: Array<{
    id: string;
    title?: string;
    kicker?: string;
    copy?: string;
    modelImage?: string;
    ctaLabel?: string;
    ctaLink?: string;
    productSlugs?: string[];
    visible?: boolean;
  }>;
  customSections?: Array<{
    id: string;
    type?: string;
    visible?: boolean;
    heading?: string;
    subtext?: string;
    imageUrl?: string;
    ctaLabel?: string;
    ctaLink?: string;
    body?: string;
    order?: number;
    carouselCategory?: string;
    productIds?: string[];
  }>;
  newsletterHeading?: string;
  newsletterSubtext?: string;
};

type HomepageResponse = {
  config?: HomepageConfig | null;
};

const PRESET_GRADIENTS = [
  { label: "Dark",          value: "linear-gradient(160deg,#1a1a1a,#3d3d3d)" },
  { label: "Forest",        value: "linear-gradient(160deg,#2d4a2d,#4a7a4a)" },
  { label: "Cream",         value: "linear-gradient(160deg,#c5b99a,#e8dcc8)" },
  { label: "Winter Dark",   value: "linear-gradient(180deg,#111,#333)" },
  { label: "Winter Warm",   value: "linear-gradient(180deg,#c8b89a,#a89070)" },
  { label: "Summer Blue",   value: "linear-gradient(180deg,#a8c8e8,#6090c0)" },
  { label: "Summer Coral",  value: "linear-gradient(180deg,#f0b090,#e07050)" },
  { label: "Spring Pink",   value: "linear-gradient(160deg,#f0d0d8,#d8a0b0)" },
  { label: "Autumn Orange", value: "linear-gradient(160deg,#e8a050,#c06820)" },
  { label: "Navy",          value: "linear-gradient(160deg,#1a2a4a,#2a4a8a)" },
];

const CUSTOM_SECTION_TYPES = [
  { value: "product_carousel", label: "Product Carousel", desc: "Horizontal scrolling product row" },
  { value: "text",             label: "Text Block",        desc: "Centred heading + body text" },
  { value: "image_text",       label: "Image + Text",      desc: "Image on one side, text the other" },
  { value: "cta",              label: "Full-Width CTA",    desc: "Large call-to-action strip" },
];

const orderStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];
const paymentStatuses = ["pending", "paid", "failed", "refunded"];
const reviewStatuses = ["pending", "approved", "all"];
const supportStatuses = ["all", "new", "open", "resolved", "closed"];
const statusColors: Record<string, string> = {
  pending: "#d97706",
  confirmed: "#1f7a36",
  processing: "#2563eb",
  shipped: "#6d28d9",
  delivered: "#1f7a36",
  cancelled: "#dc2626",
  refunded: "#6b7280"
};

const defaultSettings: StoreSettings = {
  storeName: "Werd",
  logoUrl: "",
  supportEmail: "",
  whatsappNumber: "254700000000",
  currencyCode: "KES",
  currencyLabel: "KSh",
  freeShippingVisible: true,
  freeShippingText: "FREE SHIPPING ON ORDERS OVER KSh 5,000",
  locationName: "",
  locationAddress: "",
  mapEmbedUrl: "",
  socialLinks: { instagram: "", telegram: "", facebook: "", x: "" },
  policyLinks: { returns: "", shipping: "", privacy: "/privacy-policy", terms: "/terms-and-conditions" }
};

function AdminHeader({ title, count, action }: { title: string; count?: string; action?: React.ReactNode }) {
  return (
    <div className="admin-functional-header">
      <div>
        <p>Admin Console</p>
        <h1>{title}</h1>
        {count && <span>{count}</span>}
      </div>
      <div>
        <Link href="/admin">Dashboard</Link>
        {action}
      </div>
    </div>
  );
}

function ErrorBox({ error }: { error: string }) {
  if (!error) return null;
  return <div className="admin-error">{error}</div>;
}

export function AdminDashboardFunctional() {
  const [data, setData] = useState<any>(null);
  const [chart, setChart] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      adminFetch<any>("/admin/analytics"),
      adminFetch<any>("/admin/analytics/revenue-chart?months=6")
    ])
      .then(([analytics, revenueChart]) => {
        setData(analytics);
        setChart(revenueChart.chart || []);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (!data && !error) return <div className="admin-loading">Loading dashboard...</div>;

  const maxRevenue = Math.max(...chart.map((item) => Number(item.revenue || 0)), 1);
  const growth = Number(data?.revenue?.growth || 0);
  const stats = data ? [
    ["Total Revenue", money(data.revenue?.total), `${growth >= 0 ? "+" : ""}${growth}% vs last month`, growth >= 0 ? "good" : "bad"],
    ["This Month", money(data.revenue?.thisMonth), `${data.orders?.thisMonth || 0} orders`],
    ["Total Orders", data.orders?.total || 0, `${data.orders?.pending || 0} pending / ${data.abandonedCarts || 0} abandoned carts`],
    ["Customers", data.customers?.total || 0, `+${data.customers?.newThisMonth || 0} this month / ${data.repeatCustomers || 0} repeat`]
  ] : [];
  const quickLinks = [
    ["/admin/products", "Products"],
    ["/admin/reviews", "Reviews"],
    ["/admin/media", "Media"],
    ["/admin/orders", "Orders"],
    ["/admin/homepage", "Homepage Editor"],
    ["/admin/coupons", "Coupons"],
    ["/admin/shipping", "Shipping"],
    ["/admin/support", "Support"],
    ["/admin/settings", "Settings"],
    ["/admin/staff", "Staff"],
    ["/", "Store"]
  ];

  return (
    <div className="admin-functional-page admin-dashboard-page">
      <header className="admin-dashboard-hero">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back. Here is what is happening across Werd right now.</p>
        </div>
      </header>
      <ErrorBox error={error} />
      <nav className="admin-quick-nav" aria-label="Admin quick links">
        {quickLinks.map(([href, label]) => (
          <Link key={href} href={href} className={href === "/" ? "ghost" : ""}>{label}</Link>
        ))}
      </nav>
      <div className="admin-stat-grid">
        {stats.map(([label, value, sub, tone]) => (
          <article key={String(label)}>
            <span>{label}</span>
            <strong className={tone ? String(tone) : ""}>{value}</strong>
            <p>{sub}</p>
          </article>
        ))}
      </div>
      <div className="admin-dashboard-grid">
        <section className="admin-panel admin-revenue-panel">
          <h2>Revenue - Last 6 Months</h2>
          <div className="admin-bars">
            {chart.map((item) => (
              <div key={item.month}>
                <em>{Number(item.revenue || 0).toLocaleString()}</em>
                <span style={{ height: `${Math.max(5, Math.min(100, Number(item.revenue || 0) / maxRevenue * 100))}%` }} />
                <p>{item.month}</p>
              </div>
            ))}
          </div>
        </section>
        <aside className="admin-side-stack">
          <section className="admin-panel">
            <h2>Inventory</h2>
            <strong className="admin-large-number">{data?.products?.total || 0}</strong>
            <p>{data?.products?.lowStock || 0} low stock products</p>
          </section>
          <section className="admin-panel">
            <h2>Top Products</h2>
            {(data?.topProducts || []).slice(0, 4).map((product: any, index: number) => (
              <p className="admin-row" key={product._id || product.name}>
                <span>{index + 1}. {product.name}</span>
                <strong>{product.totalSold || 0} sold</strong>
              </p>
            ))}
            {!(data?.topProducts || []).length && <p>No sales yet</p>}
          </section>
          <Breakdown title="Category Sales" rows={data?.categorySales || []} valueKey="revenue" isMoney />
        </aside>
      </div>
      <div className="admin-two-col">
        <Breakdown title="Order Status" rows={data?.orderStatusBreakdown || []} />
        <Breakdown title="Payment Status" rows={data?.paymentStatusBreakdown || []} />
      </div>
      <section className="admin-panel admin-recent-orders">
        <div className="admin-panel-title">
          <h2>Recent Orders</h2>
          <Link href="/admin/orders">View all</Link>
        </div>
        {(data?.recentOrders || []).slice(0, 6).map((order: any) => (
          <Link href="/admin/orders" className="admin-order-row" key={order._id}>
            <span>#{order.orderNumber}</span>
            <span>{order.user?.firstName} {order.user?.lastName}</span>
            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
            <strong>{money(order.total)}</strong>
            <em style={{ background: statusColors[order.status] || "#111" }}>{order.status}</em>
          </Link>
        ))}
        {!(data?.recentOrders || []).length && <p>No orders yet.</p>}
      </section>
    </div>
  );
}

function Breakdown({ title, rows, valueKey = "count", isMoney = false }: { title: string; rows: any[]; valueKey?: string; isMoney?: boolean }) {
  return (
    <section className="admin-panel">
      <h2>{title}</h2>
      {rows.length ? rows.slice(0, 6).map((row) => (
        <p className="admin-row" key={row._id || "unknown"}>
          <span>{row._id || "unknown"}</span>
          <strong>{isMoney ? money(row[valueKey]) : row[valueKey]}</strong>
        </p>
      )) : <p>No data yet</p>}
    </section>
  );
}

export function AdminProductsFunctional() {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [lowStock, setLowStock] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (lowStock) params.set("lowStock", "10");
    const data = await adminFetch<{ products: Product[] }>(`/admin/products?${params}`);
    setProducts(data.products || []);
  }

  useEffect(() => { load().catch((err) => setError(err.message)); }, [page, lowStock]);

  async function toggle(product: Product) {
    await adminFetch(`/admin/products/${product._id}`, { method: "PUT", body: JSON.stringify({ isPublished: !product.isPublished }) });
    await load();
  }

  async function remove(product: Product) {
    if (!confirm(`Unpublish "${product.name}"?`)) return;
    await adminFetch(`/admin/products/${product._id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="admin-functional-page">
      <AdminHeader title="Products" count={`${products.length} loaded`} action={<Link href="/admin/products/new">Add Product</Link>} />
      <ErrorBox error={error} />
      <form className="admin-toolbar" onSubmit={(event) => { event.preventDefault(); load().catch((err) => setError(err.message)); }}>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products..." />
        <button type="submit">Search</button>
        <button type="button" className={lowStock ? "active" : ""} onClick={() => setLowStock((value) => !value)}>Low Stock</button>
      </form>
      <div className="admin-table">
        {products.map((product) => (
          <article key={product._id}>
            <img src={product.images?.[0]?.url || "/icon.svg"} alt={product.name} />
            <div><h2>{product.name}</h2><p>{product.slug}</p></div>
            <span>{product.category} / {product.gender}</span>
            <strong>{money(product.price)}</strong>
            <span>{product.totalStock ?? 0} stock</span>
            <span className={product.isPublished ? "live" : "draft"}>{product.isPublished ? "Live" : "Draft"}</span>
            <div>
              <Link href={`/admin/products/${product._id}/edit`}>Edit</Link>
              <button type="button" onClick={() => toggle(product)}>{product.isPublished ? "Hide" : "Publish"}</button>
              <button type="button" onClick={() => remove(product)}>Delete</button>
            </div>
          </article>
        ))}
      </div>
      <div className="admin-pager"><button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button><span>Page {page}</span><button type="button" onClick={() => setPage((p) => p + 1)}>Next</button></div>
    </div>
  );
}

export function AdminOrdersFunctional() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expanded, setExpanded] = useState("");
  const [status, setStatus] = useState("");
  const [payment, setPayment] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const params = new URLSearchParams({ page: "1", limit: "20" });
    if (status) params.set("status", status);
    if (payment) params.set("paymentStatus", payment);
    if (search) params.set("q", search);
    const data = await adminFetch<{ orders: Order[] }>(`/admin/orders?${params}`);
    setOrders(data.orders || []);
  }

  useEffect(() => { load().catch((err) => setError(err.message)); }, [status, payment]);

  async function update(order: Order, updates: Record<string, string>) {
    const data = await adminFetch<{ order: Order }>(`/admin/orders/${order._id}`, { method: "PUT", body: JSON.stringify(updates) });
    setOrders((items) => items.map((item) => item._id === order._id ? data.order : item));
  }

  return (
    <div className="admin-functional-page">
      <AdminHeader title="Orders" count={`${orders.length} loaded`} />
      <ErrorBox error={error} />
      <form className="admin-toolbar" onSubmit={(event) => { event.preventDefault(); load().catch((err) => setError(err.message)); }}>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search orders..." />
        <select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{orderStatuses.map((item) => <option key={item}>{item}</option>)}</select>
        <select value={payment} onChange={(event) => setPayment(event.target.value)}><option value="">All payments</option>{paymentStatuses.map((item) => <option key={item}>{item}</option>)}</select>
        <button type="submit">Search</button>
      </form>
      <div className="admin-order-list">
        {orders.map((order) => (
          <article key={order._id}>
            <button type="button" onClick={() => setExpanded(expanded === order._id ? "" : order._id)}>
              <span>#{order.orderNumber}</span>
              <span>{order.user?.firstName} {order.user?.lastName}</span>
              <strong>{money(order.total)}</strong>
              <em>{order.status}</em>
            </button>
            {expanded === order._id && (
              <div className="admin-order-detail">
                <section>{order.items?.map((item, index) => <p key={`${item.name}-${index}`}><span>{item.name} x{item.quantity}</span><strong>{money(item.price * item.quantity)}</strong></p>)}</section>
                <section><p>{order.shippingAddress?.fullName}</p><p>{order.shippingAddress?.line1}</p><p>{order.shippingAddress?.city} {order.shippingAddress?.phone}</p></section>
                <section>
                  <select value={order.status} onChange={(event) => update(order, { status: event.target.value })}>{orderStatuses.map((item) => <option key={item}>{item}</option>)}</select>
                  <input placeholder="Tracking number" defaultValue={order.trackingNumber || ""} onBlur={(event) => update(order, { trackingNumber: event.target.value })} />
                  <input placeholder="Carrier" defaultValue={order.trackingCarrier || ""} onBlur={(event) => update(order, { trackingCarrier: event.target.value })} />
                  <textarea placeholder="Admin note" defaultValue={order.adminNote || ""} onBlur={(event) => update(order, { adminNote: event.target.value })} />
                </section>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

const emptyCoupon = { code: "", type: "percentage", value: "", minOrder: "", maxUses: "", onePerUser: true, expiresAt: "", description: "", isActive: true };

export function AdminCouponsFunctional() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState<any>(emptyCoupon);
  const [editing, setEditing] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const data = await adminFetch<{ coupons: Coupon[] }>("/coupons/admin");
    setCoupons(data.coupons || []);
  }
  useEffect(() => { load().catch((err) => setError(err.message)); }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    const payload = { ...form, code: form.code.trim().toUpperCase(), value: Number(form.value), minOrder: Number(form.minOrder || 0), maxUses: form.maxUses ? Number(form.maxUses) : null, expiresAt: form.expiresAt || null };
    await adminFetch(`/coupons/admin${editing ? `/${editing}` : ""}`, { method: editing ? "PUT" : "POST", body: JSON.stringify(payload) });
    setForm(emptyCoupon); setEditing(""); setShowForm(false); await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this coupon?")) return;
    await adminFetch(`/coupons/admin/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="admin-functional-page">
      <AdminHeader title="Coupons" count={`${coupons.length} codes`} action={<button type="button" onClick={() => setShowForm(true)}>New Coupon</button>} />
      <ErrorBox error={error} />
      {showForm && <ResourceForm onSubmit={save} form={form} setForm={setForm} fields={["code", "type", "value", "minOrder", "maxUses", "expiresAt", "description"]} />}
      <div className="admin-card-list">{coupons.map((coupon) => <article key={coupon._id}><h2>{coupon.code}</h2><p>{coupon.type === "percentage" ? `${coupon.value}%` : money(coupon.value)} off</p><span>{coupon.usedCount || 0}{coupon.maxUses ? `/${coupon.maxUses}` : ""} uses</span><div><button onClick={() => { setEditing(coupon._id); setForm({ ...coupon, expiresAt: coupon.expiresAt?.slice(0, 10) || "" }); setShowForm(true); }}>Edit</button><button onClick={() => remove(coupon._id)}>Delete</button></div></article>)}</div>
    </div>
  );
}

export function AdminShippingFunctional() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [form, setForm] = useState<any>({ name: "", regions: "", price: "", freeOver: "", minDays: 1, maxDays: 5, isActive: true, sortOrder: 0 });
  const [editing, setEditing] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const data = await adminFetch<{ zones: Zone[] }>("/shipping/admin");
    setZones(data.zones || []);
  }
  useEffect(() => { load().catch((err) => setError(err.message)); }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    const payload = { ...form, price: Number(form.price), freeOver: form.freeOver ? Number(form.freeOver) : null, minDays: Number(form.minDays), maxDays: Number(form.maxDays), sortOrder: Number(form.sortOrder), regions: String(form.regions || "").split(",").map((item) => item.trim()).filter(Boolean) };
    await adminFetch(`/shipping/admin${editing ? `/${editing}` : ""}`, { method: editing ? "PUT" : "POST", body: JSON.stringify(payload) });
    setShowForm(false); setEditing(""); await load();
  }

  return (
    <div className="admin-functional-page">
      <AdminHeader title="Shipping" count={`${zones.length} zones`} action={<button type="button" onClick={() => setShowForm(true)}>Add Zone</button>} />
      <ErrorBox error={error} />
      {showForm && <ResourceForm onSubmit={save} form={form} setForm={setForm} fields={["name", "regions", "price", "freeOver", "minDays", "maxDays", "sortOrder"]} />}
      <div className="admin-card-list">{zones.map((zone) => <article key={zone._id}><h2>{zone.name}</h2><p>{zone.regions?.join(" / ")}</p><strong>{zone.price === 0 ? "Free" : money(zone.price)}</strong><span>{zone.minDays}-{zone.maxDays} days</span><div><button onClick={() => { setEditing(zone._id); setForm({ ...zone, regions: zone.regions?.join(", ") || "" }); setShowForm(true); }}>Edit</button></div></article>)}</div>
    </div>
  );
}

export function AdminHomepageFunctional() {
  const [config, setConfig] = useState<HomepageConfig | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [active, setActive] = useState("hero");
  const [previewIndex, setPreviewIndex] = useState(0);
  const [newHeroSlide, setNewHeroSlide] = useState({
    tagline: "",
    title: "",
    ctaLabel: "",
    ctaLink: "/shop",
    category: "",
    imageUrl: "",
    bgColor: ""
  });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminFetch<HomepageResponse>("/admin/homepage")
      .then((payload) => setConfig(normalizeHomepage(payload.config || {})))
      .catch((err) => setError(err.message));
    adminFetch<{ products: Product[] }>("/admin/products?limit=100")
      .then((payload) => setProducts(payload.products || []))
      .catch(() => null);
  }, []);

  if (!config && !error) return <div className="admin-loading">Loading homepage editor...</div>;
  if (!config) return <ErrorBox error={error} />;

  function update<K extends keyof HomepageConfig>(key: K, value: HomepageConfig[K]) {
    setConfig((current) => current ? { ...current, [key]: value } : current);
  }

  function updateSlide(index: number, key: string, value: string | boolean) {
    setConfig((current) => {
      if (!current) return current;
      const slides = [...(current.heroSlides || [])];
      slides[index] = { ...slides[index], [key]: value };
      return { ...current, heroSlides: slides };
    });
  }

  function removeSlide(index: number) {
    setConfig((current) => {
      if (!current) return current;
      return { ...current, heroSlides: (current.heroSlides || []).filter((_, slideIndex) => slideIndex !== index) };
    });
  }

  function addHeroSlide() {
    const slide = {
      tagline: newHeroSlide.tagline.trim(),
      title: newHeroSlide.title.trim(),
      ctaLabel: newHeroSlide.ctaLabel.trim() || "SHOP NOW",
      ctaLink: newHeroSlide.ctaLink.trim() || "/shop",
      category: newHeroSlide.category.trim(),
      imageUrl: newHeroSlide.imageUrl.trim(),
      bgColor: newHeroSlide.bgColor.trim() || "linear-gradient(135deg,#111,#777)"
    };

    if (!slide.tagline || !slide.title) {
      setError("Add a slide tagline and title before adding it.");
      return;
    }

    setError("");
    update("heroSlides", [...(config?.heroSlides || []), slide]);
    setNewHeroSlide({ tagline: "", title: "", ctaLabel: "", ctaLink: "/shop", category: "", imageUrl: "", bgColor: "" });
  }

  function updateCard(index: number, key: string, value: string | boolean) {
    setConfig((current) => {
      if (!current) return current;
      const cards = [...(current.featuredCards || [])];
      cards[index] = { ...cards[index], [key]: value };
      return { ...current, featuredCards: cards };
    });
  }

  function updateFit(index: number, key: string, value: string | boolean | string[]) {
    setConfig((current) => {
      if (!current) return current;
      const fits = [...(current.buyTheFits || [])];
      fits[index] = { ...fits[index], [key]: value };
      return { ...current, buyTheFits: fits };
    });
  }

  function toggleFitProduct(index: number, slug: string) {
    const fit = config?.buyTheFits?.[index];
    const current = new Set(fit?.productSlugs || []);
    if (current.has(slug)) current.delete(slug);
    else current.add(slug);
    updateFit(index, "productSlugs", Array.from(current));
  }

  async function save() {
    setSaving(true);
    setError("");
    setSaved("");
    try {
      const payload = await adminFetch<HomepageResponse>("/admin/homepage", { method: "PUT", body: JSON.stringify(config) });
      setConfig(normalizeHomepage(payload.config || {}));
      setSaved("Homepage saved and ready for the storefront.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const firstSlide = config.heroSlides?.[0];
  const previewSlides = config.heroSlides?.length ? config.heroSlides : [];
  const selectedHeroSlide = previewSlides[Math.min(previewIndex, Math.max(0, previewSlides.length - 1))] || firstSlide;
  const selectedCard = (config.featuredCards || [])[Math.min(previewIndex, Math.max(0, (config.featuredCards || []).length - 1))];
  const selectedFit = (config.buyTheFits || [])[Math.min(previewIndex, Math.max(0, (config.buyTheFits || []).length - 1))];
  function addCustomSection(type: string) {
    const id = `custom_${Date.now()}`;
    setConfig((current) => {
      if (!current) return current;
      return {
        ...current,
        customSections: [...(current.customSections || []), { id, type, visible: true, heading: "NEW SECTION", subtext: "", body: "", imageUrl: "", ctaLabel: "SHOP ALL", ctaLink: "/shop", carouselCategory: "" }],
        sectionOrder: [...(current.sectionOrder || []), id],
      };
    });
    setActive(id);
  }

  function updateCustomSection(id: string, field: string, value: string | boolean | string[]) {
    setConfig((current) => {
      if (!current) return current;
      return { ...current, customSections: (current.customSections || []).map((s) => s.id === id ? { ...s, [field]: value } : s) };
    });
  }

  function deleteCustomSection(id: string) {
    if (!window.confirm("Delete this custom section?")) return;
    setConfig((current) => {
      if (!current) return current;
      return {
        ...current,
        customSections: (current.customSections || []).filter((s) => s.id !== id),
        sectionOrder: (current.sectionOrder || []).filter((k) => k !== id),
      };
    });
    setActive("hero");
  }

  const sections = [
    ["hero", "Hero"],
    ["layout", "Layout"],
    ["ticker", "Ticker"],
    ["cards", "Cards"],
    ["fit", "Buy The Fit"],
    ["collection", "Collection"],
    ["banner", "Banner"],
    ["newsletter", "Newsletter"],
    ["custom", "Custom"],
  ];
  const movableSections = [
    ["ticker", "Ticker"],
    ["cards", "Featured Cards"],
    ["buy-fit", "Buy The Fit"],
    ["collection", "Collection"],
    ["products", "Product Grid"],
    ["banner", "Split Banner"]
  ];

  return (
    <div className="admin-functional-page">
      <AdminHeader title="Homepage" count="Live editor with previews" action={<button type="button" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Homepage"}</button>} />
      <ErrorBox error={error} />
      {saved && <div className="admin-loading">{saved}</div>}
      <div className="homepage-editor-shell">
        <aside className="homepage-editor-tabs">
          {sections.map(([id, label]) => <button type="button" className={active === id ? "active" : ""} onClick={() => { setActive(id); setPreviewIndex(0); }} key={id}>{label}</button>)}
        </aside>
        <section className="homepage-editor-fields">
          {active === "hero" && (
            <>
              <h2>Moving Hero Slides</h2>
              {(config.heroSlides || []).map((slide, index) => (
                <div className="homepage-fieldset" key={index} onClick={() => setPreviewIndex(index)} onFocus={() => setPreviewIndex(index)}>
                  <div className="homepage-fieldset-head">
                    <h3>Slide {index + 1}</h3>
                    <button type="button" className="danger" onClick={() => removeSlide(index)}>Delete</button>
                  </div>
                  <input value={slide.tagline || ""} onChange={(event) => updateSlide(index, "tagline", event.target.value)} placeholder="Tagline" />
                  <input value={slide.title || ""} onChange={(event) => updateSlide(index, "title", event.target.value)} placeholder="Title" />
                  <input value={slide.ctaLabel || ""} onChange={(event) => updateSlide(index, "ctaLabel", event.target.value)} placeholder="CTA label" />
                  <input value={slide.ctaLink || ""} onChange={(event) => updateSlide(index, "ctaLink", event.target.value)} placeholder="CTA link" />
                  <input value={slide.category || ""} onChange={(event) => updateSlide(index, "category", event.target.value)} placeholder="Category slug" />
                  <input value={slide.imageUrl || ""} onChange={(event) => updateSlide(index, "imageUrl", event.target.value)} placeholder="Image URL" />
                  <input value={slide.bgColor || ""} onChange={(event) => updateSlide(index, "bgColor", event.target.value)} placeholder="Background CSS" />
                  <div className="gradient-presets" aria-label="Preset gradients">
                    {PRESET_GRADIENTS.map((g) => (
                      <button type="button" key={g.value} title={g.label} style={{ background: g.value }} className={slide.bgColor === g.value ? "active" : ""} onClick={() => updateSlide(index, "bgColor", g.value)} />
                    ))}
                  </div>
                </div>
              ))}
              <div className="homepage-fieldset add-slide-form">
                <h3>Add New Slide</h3>
                <input value={newHeroSlide.tagline} onChange={(event) => setNewHeroSlide((slide) => ({ ...slide, tagline: event.target.value }))} placeholder="Tagline" />
                <input value={newHeroSlide.title} onChange={(event) => setNewHeroSlide((slide) => ({ ...slide, title: event.target.value }))} placeholder="Title" />
                <input value={newHeroSlide.ctaLabel} onChange={(event) => setNewHeroSlide((slide) => ({ ...slide, ctaLabel: event.target.value }))} placeholder="CTA label" />
                <input value={newHeroSlide.ctaLink} onChange={(event) => setNewHeroSlide((slide) => ({ ...slide, ctaLink: event.target.value }))} placeholder="CTA link" />
                <input value={newHeroSlide.category} onChange={(event) => setNewHeroSlide((slide) => ({ ...slide, category: event.target.value }))} placeholder="Category slug" />
                <input value={newHeroSlide.imageUrl} onChange={(event) => setNewHeroSlide((slide) => ({ ...slide, imageUrl: event.target.value }))} placeholder="Image URL" />
                <input value={newHeroSlide.bgColor} onChange={(event) => setNewHeroSlide((slide) => ({ ...slide, bgColor: event.target.value }))} placeholder="Background CSS" />
                <div className="gradient-presets" aria-label="Preset gradients">
                  {PRESET_GRADIENTS.map((g) => (
                    <button type="button" key={g.value} title={g.label} style={{ background: g.value }} className={newHeroSlide.bgColor === g.value ? "active" : ""} onClick={() => setNewHeroSlide((slide) => ({ ...slide, bgColor: g.value }))} />
                  ))}
                </div>
                <button type="button" onClick={addHeroSlide}>Add Slide</button>
              </div>
            </>
          )}
          {active === "ticker" && (
            <>
              <h2>Announcement + Ticker</h2>
              <input value={config.announcementText || ""} onChange={(event) => update("announcementText", event.target.value)} placeholder="Announcement text" />
              <textarea value={config.tickerText || ""} onChange={(event) => update("tickerText", event.target.value)} placeholder="Ticker text" rows={5} />
            </>
          )}
          {active === "layout" && (
            <>
              <h2>Move Homepage Sections</h2>
              <p>Hero stays locked at the top. Move everything else by changing these positions.</p>
              {(config.sectionOrder || []).map((sectionId, index) => (
                <div className="homepage-fieldset" key={`${sectionId}-${index}`}>
                  <h3>Position {index + 1}</h3>
                  <select value={sectionId} onChange={(event) => {
                    const next = [...(config.sectionOrder || [])];
                    next[index] = event.target.value;
                    update("sectionOrder", Array.from(new Set(next)));
                  }}>
                    {movableSections.map(([id, label]) => <option value={id} key={id}>{label}</option>)}
                  </select>
                  <button type="button" onClick={() => update("sectionOrder", (config.sectionOrder || []).filter((_, itemIndex) => itemIndex !== index))}>Remove</button>
                </div>
              ))}
              <button type="button" onClick={() => update("sectionOrder", [...(config.sectionOrder || []), movableSections.find(([id]) => !(config.sectionOrder || []).includes(id))?.[0] || "products"])}>Add Section</button>
            </>
          )}
          {active === "cards" && (
            <>
              <h2>Featured Cards</h2>
              {(config.featuredCards || []).map((card, index) => (
                <div className="homepage-fieldset" key={index} onClick={() => setPreviewIndex(index)} onFocus={() => setPreviewIndex(index)}>
                  <h3>Card {index + 1}</h3>
                  <input value={card.title || ""} onChange={(event) => updateCard(index, "title", event.target.value)} placeholder="Title" />
                  <input value={card.category || ""} onChange={(event) => updateCard(index, "category", event.target.value)} placeholder="Category" />
                  <input value={card.imageUrl || ""} onChange={(event) => updateCard(index, "imageUrl", event.target.value)} placeholder="Image URL" />
                  <input value={card.bg || ""} onChange={(event) => updateCard(index, "bg", event.target.value)} placeholder="Background CSS" />
                </div>
              ))}
              <button type="button" onClick={() => update("featuredCards", [...(config.featuredCards || []), { title: "NEW FEATURE", category: "hoodie", bg: "#111" }])}>Add Card</button>
            </>
          )}
          {active === "fit" && (
            <>
              <h2>Buy The Fit</h2>
              <p>Add multiple fit slides. They move automatically on the homepage like the hero, and customers can tap dots to switch.</p>
              {(config.buyTheFits || []).map((fit, index) => (
                <div className="homepage-fieldset" key={fit.id || index} onClick={() => setPreviewIndex(index)} onFocus={() => setPreviewIndex(index)}>
                  <div className="homepage-fieldset-head">
                    <h3>Fit {index + 1}</h3>
                    <button type="button" className="danger" onClick={() => update("buyTheFits", (config.buyTheFits || []).filter((_, itemIndex) => itemIndex !== index))}>Delete</button>
                  </div>
                  <input value={fit.kicker || ""} onChange={(event) => updateFit(index, "kicker", event.target.value)} placeholder="Kicker" />
                  <input value={fit.title || ""} onChange={(event) => updateFit(index, "title", event.target.value)} placeholder="Title" />
                  <textarea value={fit.copy || ""} onChange={(event) => updateFit(index, "copy", event.target.value)} placeholder="Copy" rows={3} />
                  <input value={fit.modelImage || ""} onChange={(event) => updateFit(index, "modelImage", event.target.value)} placeholder="Model image URL" />
                  <input value={fit.ctaLabel || ""} onChange={(event) => updateFit(index, "ctaLabel", event.target.value)} placeholder="CTA label" />
                  <input value={fit.ctaLink || ""} onChange={(event) => updateFit(index, "ctaLink", event.target.value)} placeholder="CTA link" />
                  <textarea value={(fit.productSlugs || []).join(", ")} onChange={(event) => updateFit(index, "productSlugs", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} placeholder="Product slugs or IDs, comma separated" rows={3} />
                  <div className="homepage-product-picker">
                    {products.map((product) => (
                      <label key={product._id}>
                        <input type="checkbox" checked={(fit.productSlugs || []).includes(product.slug)} onChange={() => toggleFitProduct(index, product.slug)} />
                        <img src={product.images?.[0]?.url || "/icon.svg"} alt="" />
                        <span>{product.name}</span>
                      </label>
                    ))}
                  </div>
                  <label className="admin-check"><input type="checkbox" checked={fit.visible !== false} onChange={(event) => updateFit(index, "visible", event.target.checked)} />Visible</label>
                </div>
              ))}
              <button type="button" onClick={() => update("buyTheFits", [...(config.buyTheFits || []), { id: `fit_${Date.now()}`, kicker: "STYLED TOGETHER", title: "BUY THE FIT", copy: "Tap any piece around the model to build the full look.", modelImage: "", ctaLabel: "SHOP THE FIT", ctaLink: "/shop", productSlugs: [], visible: true }])}>Add Fit</button>
            </>
          )}
          {active === "collection" && (
            <>
              <h2>Collection Block</h2>
              <input value={config.collectionTitle || ""} onChange={(event) => update("collectionTitle", event.target.value)} placeholder="Collection title" />
              <textarea value={config.collectionSubtext || ""} onChange={(event) => update("collectionSubtext", event.target.value)} placeholder="Collection subtext" rows={5} />
            </>
          )}
          {active === "banner" && (
            <>
              <h2>Split Banner</h2>
              <input value={config.banner?.heading || ""} onChange={(event) => update("banner", { ...config.banner, heading: event.target.value })} placeholder="Heading" />
              <input value={config.banner?.subheading || ""} onChange={(event) => update("banner", { ...config.banner, subheading: event.target.value })} placeholder="Subheading" />
              <input value={config.banner?.ctaLabel || ""} onChange={(event) => update("banner", { ...config.banner, ctaLabel: event.target.value })} placeholder="CTA label" />
              <input value={config.banner?.imageUrlLeft || ""} onChange={(event) => update("banner", { ...config.banner, imageUrlLeft: event.target.value })} placeholder="Left image URL" />
              <input value={config.banner?.imageUrlRight || ""} onChange={(event) => update("banner", { ...config.banner, imageUrlRight: event.target.value })} placeholder="Right image URL" />
            </>
          )}
          {active === "newsletter" && (
            <>
              <h2>Newsletter</h2>
              <input value={config.newsletterHeading || ""} onChange={(event) => update("newsletterHeading", event.target.value)} placeholder="Heading" />
              <input value={config.newsletterSubtext || ""} onChange={(event) => update("newsletterSubtext", event.target.value)} placeholder="Subtext" />
            </>
          )}
          {active === "custom" && (
            <>
              <h2>Custom Sections</h2>
              <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--muted)" }}>Add product carousels, text blocks, and CTAs. Drag sections in Layout to reorder them.</p>
              {(config.customSections || []).length === 0 && <p style={{ fontSize: 12, color: "var(--muted)" }}>No custom sections yet. Add one below.</p>}
              {(config.customSections || []).map((section) => (
                <div className="homepage-fieldset" key={section.id}>
                  <div className="homepage-fieldset-head">
                    <h3>{CUSTOM_SECTION_TYPES.find((t) => t.value === section.type)?.label || section.type || "Custom"}</h3>
                    <button type="button" className="danger" onClick={() => deleteCustomSection(section.id)}>Delete</button>
                  </div>
                  <input value={section.heading || ""} onChange={(e) => updateCustomSection(section.id, "heading", e.target.value)} placeholder="Heading" />
                  <textarea value={section.subtext || ""} onChange={(e) => updateCustomSection(section.id, "subtext", e.target.value)} placeholder="Subtext" rows={3} />
                  {section.type === "text" && (
                    <textarea value={section.body || ""} onChange={(e) => updateCustomSection(section.id, "body", e.target.value)} placeholder="Body text" rows={5} />
                  )}
                  {(section.type === "image_text" || section.type === "cta") && (
                    <input value={section.imageUrl || ""} onChange={(e) => updateCustomSection(section.id, "imageUrl", e.target.value)} placeholder="Image URL" />
                  )}
                  {section.type === "product_carousel" && (
                    <input value={section.carouselCategory || ""} onChange={(e) => updateCustomSection(section.id, "carouselCategory", e.target.value)} placeholder="Category slug (blank = all)" />
                  )}
                  <input value={section.ctaLabel || ""} onChange={(e) => updateCustomSection(section.id, "ctaLabel", e.target.value)} placeholder="CTA label" />
                  <input value={section.ctaLink || ""} onChange={(e) => updateCustomSection(section.id, "ctaLink", e.target.value)} placeholder="CTA link" />
                  <label className="admin-check">
                    <input type="checkbox" checked={section.visible !== false} onChange={(e) => updateCustomSection(section.id, "visible", e.target.checked)} />
                    Visible
                  </label>
                </div>
              ))}
              <div className="homepage-fieldset add-slide-form">
                <h3>Add Section</h3>
                <div className="custom-section-types">
                  {CUSTOM_SECTION_TYPES.map((t) => (
                    <button type="button" key={t.value} onClick={() => addCustomSection(t.value)}>
                      <strong>{t.label}</strong>
                      <span>{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          {/* Custom section editor (when a custom section ID is active) */}
          {active.startsWith("custom_") && (() => {
            const section = (config.customSections || []).find((s) => s.id === active);
            if (!section) return null;
            return (
              <>
                <h2>{CUSTOM_SECTION_TYPES.find((t) => t.value === section.type)?.label || "Custom Section"}</h2>
                <div className="homepage-fieldset-head">
                  <span />
                  <button type="button" className="danger" onClick={() => deleteCustomSection(section.id)}>Delete Section</button>
                </div>
                <input value={section.heading || ""} onChange={(e) => updateCustomSection(section.id, "heading", e.target.value)} placeholder="Heading" />
                <textarea value={section.subtext || ""} onChange={(e) => updateCustomSection(section.id, "subtext", e.target.value)} placeholder="Subtext" rows={3} />
                {section.type === "text" && (
                  <textarea value={section.body || ""} onChange={(e) => updateCustomSection(section.id, "body", e.target.value)} placeholder="Body text" rows={5} />
                )}
                {(section.type === "image_text" || section.type === "cta") && (
                  <input value={section.imageUrl || ""} onChange={(e) => updateCustomSection(section.id, "imageUrl", e.target.value)} placeholder="Image URL" />
                )}
                {section.type === "product_carousel" && (
                  <input value={section.carouselCategory || ""} onChange={(e) => updateCustomSection(section.id, "carouselCategory", e.target.value)} placeholder="Category slug (blank = all)" />
                )}
                <input value={section.ctaLabel || ""} onChange={(e) => updateCustomSection(section.id, "ctaLabel", e.target.value)} placeholder="CTA label" />
                <input value={section.ctaLink || ""} onChange={(e) => updateCustomSection(section.id, "ctaLink", e.target.value)} placeholder="CTA link" />
                <label className="admin-check">
                  <input type="checkbox" checked={section.visible !== false} onChange={(e) => updateCustomSection(section.id, "visible", e.target.checked)} />
                  Visible on storefront
                </label>
                <button type="button" onClick={() => setActive("custom")}>← Back to All Custom Sections</button>
              </>
            );
          })()}
        </section>
        <aside className="homepage-live-preview">
          <p>Live Preview</p>
          {active === "hero" && (
            <>
              <div className="homepage-hero-preview" style={{ background: selectedHeroSlide?.imageUrl ? `linear-gradient(rgba(0,0,0,.28),rgba(0,0,0,.28)), url(${selectedHeroSlide.imageUrl}) center/cover` : selectedHeroSlide?.bgColor }}>
                <span>{selectedHeroSlide?.tagline || "No tagline"}</span>
                <strong>{selectedHeroSlide?.title || "Untitled"}</strong>
                <em>{selectedHeroSlide?.ctaLabel || "No CTA"}</em>
              </div>
              <div className="homepage-copy-preview">
                <h3>Slide {previewSlides.length ? Math.min(previewIndex + 1, previewSlides.length) : 0} of {previewSlides.length}</h3>
                <p>{selectedHeroSlide?.ctaLink || "No link"}</p>
              </div>
            </>
          )}
          {active === "ticker" && <div className="homepage-ticker-preview">{config.tickerText}</div>}
          {active === "layout" && (
            <div className="homepage-copy-preview">
              <h3>Section Order</h3>
              <p>{(config.sectionOrder || []).join(" / ") || "No sections selected"}</p>
            </div>
          )}
          {active === "cards" && (
            <>
              <div className="homepage-card-preview single">
                <article style={{ background: selectedCard?.imageUrl ? `url(${selectedCard.imageUrl}) center/cover` : selectedCard?.bg }}>
                  <strong>{selectedCard?.title || "No card selected"}</strong>
                </article>
              </div>
              <div className="homepage-copy-preview">
                <h3>{selectedCard?.category || "Category"}</h3>
                <p>Card {selectedCard ? Math.min(previewIndex + 1, config.featuredCards?.length || 1) : 0} of {config.featuredCards?.length || 0}</p>
              </div>
            </>
          )}
          {active === "fit" && (
            <>
              <div className="homepage-fit-preview">
                {selectedFit?.modelImage && <img src={selectedFit.modelImage} alt={selectedFit.title || "Fit preview"} />}
                <h3>{selectedFit?.title || "No fit selected"}</h3>
                <p>{selectedFit?.copy || "No fit slide added yet."}</p>
              </div>
              <div className="homepage-copy-preview">
                <h3>Products</h3>
                <p>{selectedFit?.productSlugs?.length ? selectedFit.productSlugs.join(" / ") : "No products selected"}</p>
              </div>
            </>
          )}
          {active === "collection" && (
            <div className="homepage-copy-preview">
              <h3>{config.collectionTitle}</h3>
              <p>{config.collectionSubtext}</p>
            </div>
          )}
          {active === "banner" && (
            <div className="homepage-copy-preview">
              <h3>{config.banner?.heading || "No banner heading"}</h3>
              <p>{config.banner?.subheading || config.banner?.ctaLabel || "No banner details"}</p>
            </div>
          )}
          {active === "newsletter" && (
            <div className="homepage-copy-preview">
              <h3>{config.newsletterHeading}</h3>
              <p>{config.newsletterSubtext}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export function AdminMediaFunctional() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await adminFetch<{ assets: MediaAsset[]; pagination: any }>(`/admin/media?page=${page}&limit=30`);
      setAssets(data.assets || []);
      setPagination(data.pagination || {});
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page]);

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("images", file));
    setUploading(true);
    setError("");
    try {
      const response = await fetch("/api/backend/admin/upload", { method: "POST", body: formData });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Upload failed.");
      setNotice("Images uploaded.");
      setPage(1);
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function remove(asset: MediaAsset) {
    if (!confirm("Remove this image from the media library?")) return;
    await adminFetch(`/admin/media/${asset._id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="admin-functional-page">
      <AdminHeader title="Media" count={`${pagination.total || assets.length} images`} action={<label className="admin-upload-button">{uploading ? "Uploading..." : "Upload Images"}<input type="file" accept="image/*" multiple onChange={(event) => uploadFiles(event.target.files)} /></label>} />
      <ErrorBox error={error} />
      {notice && <div className="admin-loading">{notice}</div>}
      {loading ? <div className="admin-loading">Loading media...</div> : (
        <div className="admin-media-grid">
          {assets.map((asset) => (
            <article key={asset._id}>
              <img src={asset.url} alt={asset.originalName || "Store media"} />
              <p>{asset.originalName || asset.source || "media asset"}</p>
              <div>
                <button type="button" onClick={() => navigator.clipboard?.writeText(asset.url)}>Copy URL</button>
                <button type="button" onClick={() => remove(asset)}>Remove</button>
              </div>
            </article>
          ))}
        </div>
      )}
      {pagination.pages > 1 && <div className="admin-pager"><button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button><span>Page {page} of {pagination.pages}</span><button type="button" onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}>Next</button></div>}
    </div>
  );
}

export function AdminReviewsFunctional() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [workingId, setWorkingId] = useState("");

  async function load(nextStatus = status) {
    setLoading(true);
    setError("");
    try {
      const data = await adminFetch<{ reviews: ReviewItem[] }>(`/admin/reviews?status=${nextStatus}`);
      setReviews(data.reviews || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(status); }, [status]);

  async function updateReview(item: ReviewItem, approved: boolean) {
    setWorkingId(item.review._id);
    setError("");
    setNotice("");
    try {
      await adminFetch(`/admin/products/${item.productId}/reviews/${item.review._id}`, { method: "PATCH", body: JSON.stringify({ approved }) });
      setNotice(approved ? "Review approved." : "Review moved back to pending.");
      await load(status);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setWorkingId("");
    }
  }

  async function remove(item: ReviewItem) {
    if (!confirm("Delete this review?")) return;
    await adminFetch(`/admin/products/${item.productId}/reviews/${item.review._id}`, { method: "DELETE" });
    await load(status);
  }

  return (
    <div className="admin-functional-page">
      <AdminHeader title="Reviews" count={`${reviews.length} loaded`} />
      <ErrorBox error={error} />
      {notice && <div className="admin-loading">{notice}</div>}
      <div className="admin-filter-row">{reviewStatuses.map((item) => <button type="button" className={status === item ? "active" : ""} key={item} onClick={() => setStatus(item)}>{item}</button>)}</div>
      {loading ? <div className="admin-loading">Loading reviews...</div> : (
        <div className="admin-review-list">
          {reviews.map((item) => {
            const approved = item.review.approved !== false;
            return (
              <article key={`${item.productId}-${item.review._id}`}>
                <div>
                  <span>{new Date(item.review.createdAt || Date.now()).toLocaleString()} / {approved ? "Approved" : "Pending"}</span>
                  <h2>{item.productName}</h2>
                  <p>{item.review.name || item.review.user?.email || "customer"}</p>
                  <strong>{"★".repeat(item.review.rating)}{"☆".repeat(Math.max(0, 5 - item.review.rating))}</strong>
                </div>
                <p>{item.review.comment}</p>
                <div>
                  <Link href={`/product/${item.productSlug}`} target="_blank">View Product</Link>
                  {!approved ? <button disabled={workingId === item.review._id} onClick={() => updateReview(item, true)}>Approve</button> : <button disabled={workingId === item.review._id} onClick={() => updateReview(item, false)}>Unapprove</button>}
                  <button disabled={workingId === item.review._id} onClick={() => remove(item)}>Delete</button>
                </div>
              </article>
            );
          })}
          {!reviews.length && <div className="admin-loading">No reviews here.</div>}
        </div>
      )}
    </div>
  );
}

export function AdminSettingsFunctional() {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    adminFetch<{ settings: StoreSettings }>("/settings/admin")
      .then((data) => setSettings(mergeSettings(data.settings)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function setField(key: keyof StoreSettings, value: string | boolean) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function setNested(group: "socialLinks" | "policyLinks", key: string, value: string) {
    setSettings((current) => ({ ...current, [group]: { ...(current[group] || {}), [key]: value } }));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSaved("");
    try {
      const data = await adminFetch<{ settings: StoreSettings }>("/settings/admin", { method: "PUT", body: JSON.stringify(settings) });
      setSettings(mergeSettings(data.settings));
      setSaved("Settings saved.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="admin-loading">Loading settings...</div>;

  return (
    <div className="admin-functional-page">
      <AdminHeader title="Settings" count="Store info, links, and storefront defaults" />
      <ErrorBox error={error} />
      {saved && <div className="admin-loading">{saved}</div>}
      <form className="admin-settings-form" onSubmit={save}>
        <SettingsSection title="Store Info">
          <AdminInput label="Store Name" value={settings.storeName} onChange={(value) => setField("storeName", value)} />
          <AdminInput label="Logo URL" value={settings.logoUrl || ""} onChange={(value) => setField("logoUrl", value)} />
          <AdminInput label="Support Email" value={settings.supportEmail || ""} onChange={(value) => setField("supportEmail", value)} />
          <AdminInput label="WhatsApp Number" value={settings.whatsappNumber || ""} onChange={(value) => setField("whatsappNumber", value)} />
          <AdminInput label="Currency Code" value={settings.currencyCode || ""} onChange={(value) => setField("currencyCode", value)} />
          <AdminInput label="Currency Label" value={settings.currencyLabel || ""} onChange={(value) => setField("currencyLabel", value)} />
          <label className="admin-check"><input type="checkbox" checked={settings.freeShippingVisible !== false} onChange={(event) => setField("freeShippingVisible", event.target.checked)} />Show free shipping bar</label>
          <AdminInput label="Free Shipping Text" value={settings.freeShippingText || ""} onChange={(value) => setField("freeShippingText", value)} />
        </SettingsSection>
        <SettingsSection title="Location">
          <AdminInput label="Location Name" value={settings.locationName || ""} onChange={(value) => setField("locationName", value)} />
          <AdminInput label="Location Address" value={settings.locationAddress || ""} onChange={(value) => setField("locationAddress", value)} />
          <AdminInput label="Map Embed URL" value={settings.mapEmbedUrl || ""} onChange={(value) => setField("mapEmbedUrl", value)} />
        </SettingsSection>
        <SettingsSection title="Social Links">
          {["instagram", "telegram", "facebook", "x"].map((key) => <AdminInput key={key} label={key} value={settings.socialLinks?.[key] || ""} onChange={(value) => setNested("socialLinks", key, value)} />)}
        </SettingsSection>
        <SettingsSection title="Policy Links">
          {["returns", "shipping", "privacy", "terms"].map((key) => <AdminInput key={key} label={key} value={settings.policyLinks?.[key] || ""} onChange={(value) => setNested("policyLinks", key, value)} />)}
        </SettingsSection>
        <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Settings"}</button>
      </form>
    </div>
  );
}

export function AdminSupportFunctional() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [counts, setCounts] = useState<any[]>([]);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const countMap = Object.fromEntries((counts || []).map((row) => [row._id, row.count]));

  async function load(nextStatus = status) {
    setLoading(true);
    setError("");
    try {
      const data = await adminFetch<{ messages: SupportMessage[]; counts: any[] }>(`/support/admin?status=${nextStatus}`);
      setMessages(data.messages || []);
      setCounts(data.counts || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(status); }, [status]);

  async function update(id: string, patch: Record<string, string>) {
    const data = await adminFetch<{ message: SupportMessage }>(`/support/admin/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    setMessages((items) => items.map((item) => item._id === id ? data.message : item));
    setNotice("Support message updated.");
    await load(status);
  }

  async function remove(id: string) {
    if (!confirm("Delete this support message?")) return;
    await adminFetch(`/support/admin/${id}`, { method: "DELETE" });
    setMessages((items) => items.filter((item) => item._id !== id));
  }

  return (
    <div className="admin-functional-page">
      <AdminHeader title="Support" count={`${messages.length} conversations`} />
      <ErrorBox error={error} />
      {notice && <div className="admin-loading">{notice}</div>}
      <div className="admin-filter-row">{supportStatuses.map((item) => <button type="button" className={status === item ? "active" : ""} key={item} onClick={() => setStatus(item)}>{item}{item !== "all" ? ` (${countMap[item] || 0})` : ""}</button>)}</div>
      {loading ? <div className="admin-loading">Loading support...</div> : (
        <div className="admin-support-list">
          {messages.map((message) => <SupportCard key={message._id} message={message} onUpdate={update} onDelete={remove} />)}
          {!messages.length && <div className="admin-loading">No support messages here.</div>}
        </div>
      )}
    </div>
  );
}

function SupportCard({ message, onUpdate, onDelete }: { message: SupportMessage; onUpdate: (id: string, patch: Record<string, string>) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const [adminNote, setAdminNote] = useState(message.adminNote || "");
  const [reply, setReply] = useState("");
  const [notice, setNotice] = useState("");
  const thread = message.thread?.length ? message.thread : [{ author: "customer", body: message.message, createdAt: message.createdAt }];

  async function sendReply() {
    if (!reply.trim()) return;
    const data = await adminFetch<{ message: SupportMessage; email: any }>(`/support/admin/${message._id}/replies`, { method: "POST", body: JSON.stringify({ message: reply, emailCustomer: true, status: message.status === "new" ? "open" : message.status }) });
    setReply("");
    setNotice(data.email?.sent ? "Reply saved and emailed." : "Reply saved. Email is not configured.");
  }

  return (
    <article className="admin-support-card">
      <div className="admin-support-head">
        <div>
          <span>{new Date(message.createdAt).toLocaleString()} / {message.status}</span>
          <h2>{message.subject}</h2>
          <p>{message.name} / {message.email}{message.phone ? ` / ${message.phone}` : ""}</p>
          {message.orderNumber && <p>Order: {message.orderNumber}</p>}
        </div>
        <select value={message.status} onChange={(event) => onUpdate(message._id, { status: event.target.value })}>
          <option value="new">New</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      <div className="admin-thread">
        {thread.map((item, index) => <div className={item.author === "admin" ? "admin-bubble own" : "admin-bubble"} key={item._id || index}><p>{item.body}</p><span>{item.author} / {new Date(item.createdAt).toLocaleString()}{item.emailed ? " / emailed" : ""}</span></div>)}
      </div>
      <textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Type a support reply..." rows={4} />
      {notice && <div className="admin-loading">{notice}</div>}
      <textarea value={adminNote} onChange={(event) => setAdminNote(event.target.value)} placeholder="Private admin note..." rows={3} />
      <div>
        <button type="button" onClick={sendReply}>Send Reply</button>
        <button type="button" onClick={() => onUpdate(message._id, { adminNote })}>Save Note</button>
        <button type="button" onClick={() => onUpdate(message._id, { status: "resolved" })}>Resolve</button>
        <button type="button" onClick={() => onDelete(message._id)}>Delete</button>
      </div>
    </article>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2>{title}</h2><div>{children}</div></section>;
}

function AdminInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label><span>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function mergeSettings(settings: Partial<StoreSettings> = {}): StoreSettings {
  return {
    ...defaultSettings,
    ...settings,
    socialLinks: { ...defaultSettings.socialLinks, ...(settings.socialLinks || {}) },
    policyLinks: { ...defaultSettings.policyLinks, ...(settings.policyLinks || {}) }
  };
}

function normalizeHomepage(payload: HomepageConfig): HomepageConfig {
  const defaultHeroSlides = [{
    tagline: payload.heroTagline || "LIMITED DROP",
    title: payload.heroTitle || "NEW COLLECTION",
    ctaLabel: payload.heroCtaLabel || "SHOP NOW",
    ctaLink: payload.heroCtaLink || "/shop",
    category: "hoodie",
    bgColor: "linear-gradient(135deg,#111,#777)"
  }];
  const defaultBuyTheFits = [{
    id: "fit_default",
    kicker: "STYLED TOGETHER",
    title: "BUY THE FIT",
    copy: "Tap any piece around the model to build the full look.",
    modelImage: payload.banner?.imageUrlLeft || "",
    ctaLabel: "SHOP THE FIT",
    ctaLink: "/shop",
    productSlugs: [],
    visible: true
  }];

  return {
    ...payload,
    heroSlides: Array.isArray(payload.heroSlides) ? payload.heroSlides : defaultHeroSlides,
    featuredCards: payload.featuredCards?.length ? payload.featuredCards : [{ title: "OVERSIZED HOODIES", category: "hoodie", bg: "#111" }],
    buyTheFits: Array.isArray(payload.buyTheFits) ? payload.buyTheFits : defaultBuyTheFits,
    sectionOrder: payload.sectionOrder?.length ? payload.sectionOrder : ["ticker", "cards", "buy-fit", "collection", "products", "banner"],
    collectionTitle: payload.collectionTitle || "OUR COLLECTION",
    collectionSubtext: payload.collectionSubtext || "Premium streetwear hoodies, sweatshirts and outerwear for every season.",
    newsletterHeading: payload.newsletterHeading || "SUBSCRIBE OUR NEWSLETTER",
    newsletterSubtext: payload.newsletterSubtext || "GET 10% OFF YOUR FIRST ORDER",
    banner: payload.banner || {}
  };
}

function ResourceForm({ onSubmit, form, setForm, fields }: { onSubmit: (event: FormEvent) => void; form: any; setForm: (value: any) => void; fields: string[] }) {
  return (
    <form className="admin-resource-form" onSubmit={onSubmit}>
      {fields.map((field) => (
        <label key={field}>
          <span>{field}</span>
          {field === "type" ? (
            <select value={form[field] || ""} onChange={(event) => setForm({ ...form, [field]: event.target.value })}><option value="percentage">percentage</option><option value="fixed">fixed</option></select>
          ) : (
            <input value={form[field] || ""} onChange={(event) => setForm({ ...form, [field]: event.target.value })} />
          )}
        </label>
      ))}
      <button type="submit">Save</button>
    </form>
  );
}
