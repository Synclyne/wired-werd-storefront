"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteChrome } from "@/components/site-chrome";

type Address = {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
};

type User = {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  addresses?: Address[];
  defaultAddress?: number;
  sizePreferences?: SizePreferences;
};

type SizePreferences = {
  top?: string;
  bottom?: string;
  shoe?: string;
  color?: string;
};

const emptyAddress: Address = {
  fullName: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "KE",
  phone: ""
};

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/backend${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || payload.message || "Request failed.");
  return payload as T;
}

export function AccountClient() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ user: User }>("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.replace("/");
    router.refresh();
  }

  if (loading) {
    return <SiteChrome><main className="account-shell"><section className="account-empty">Loading account...</section></main></SiteChrome>;
  }

  if (!user) return null;

  return (
    <SiteChrome>
      <main className="account-shell">
        <header className="account-header">
          <div>
            <h1>My Account</h1>
            <p>Hello, {[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email}</p>
          </div>
          <div>
            {user.role === "admin" && <Link href="/admin">Admin</Link>}
            <Link href="/account/orders">My Orders</Link>
            <button type="button" onClick={logout}>Sign Out</button>
          </div>
        </header>

        <nav className="account-tabs" aria-label="Account sections">
          {[
            ["profile", "Profile"],
            ["sizes", "Sizes"],
            ["password", "Password"],
            ["addresses", "Addresses"]
          ].map(([id, label]) => <button className={activeTab === id ? "active" : ""} type="button" onClick={() => setActiveTab(id)} key={id}>{label}</button>)}
        </nav>

        <section className="account-panel">
          {activeTab === "profile" && <ProfileForm user={user} onUser={setUser} />}
          {activeTab === "sizes" && <SizePreferenceForm user={user} onUser={setUser} />}
          {activeTab === "password" && <PasswordForm />}
          {activeTab === "addresses" && <AddressForm user={user} onUser={setUser} />}
        </section>
      </main>
    </SiteChrome>
  );
}

function ProfileForm({ user, onUser }: { user: User; onUser: (user: User) => void }) {
  const [form, setForm] = useState({ firstName: user.firstName || "", lastName: user.lastName || "", email: user.email || "" });
  const [status, setStatus] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus("Saving...");
    try {
      const data = await api<{ user: User }>("/auth/me", { method: "PUT", body: JSON.stringify(form) });
      onUser(data.user);
      setStatus("Profile updated.");
    } catch (err: any) {
      setStatus(err.message);
    }
  }

  return (
    <form className="account-form" onSubmit={submit}>
      <h2>Profile</h2>
      <div className="account-two">
        <Field label="First Name" value={form.firstName} onChange={(value) => setForm({ ...form, firstName: value })} />
        <Field label="Last Name" value={form.lastName} onChange={(value) => setForm({ ...form, lastName: value })} />
      </div>
      <Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
      {status && <p className="account-status">{status}</p>}
      <button type="submit">Save Changes</button>
    </form>
  );
}

function SizePreferenceForm({ user, onUser }: { user: User; onUser: (user: User) => void }) {
  const [form, setForm] = useState<SizePreferences>({
    top: user.sizePreferences?.top || "",
    bottom: user.sizePreferences?.bottom || "",
    shoe: user.sizePreferences?.shoe || "",
    color: user.sizePreferences?.color || ""
  });
  const [status, setStatus] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus("Saving...");
    try {
      const data = await api<{ user: User }>("/auth/me", { method: "PUT", body: JSON.stringify({ sizePreferences: form }) });
      onUser(data.user);
      setStatus("Sizes saved. Quick add will use these when a matching option exists.");
    } catch (err: any) {
      setStatus(err.message);
    }
  }

  return (
    <form className="account-form" onSubmit={submit}>
      <h2>Preferred Sizes</h2>
      <p className="account-help">These power quick-add on product cards, so checkout can move fast without picking sizes every time.</p>
      <div className="account-two">
        <label><span>Tops / Hoodies</span><select value={form.top || ""} onChange={(event) => setForm({ ...form, top: event.target.value })}><option value="">Choose size</option>{["XS", "S", "M", "L", "XL", "XXL"].map((size) => <option key={size} value={size}>{size}</option>)}</select></label>
        <label><span>Bottoms</span><select value={form.bottom || ""} onChange={(event) => setForm({ ...form, bottom: event.target.value })}><option value="">Choose size</option>{["XS", "S", "M", "L", "XL", "XXL"].map((size) => <option key={size} value={size}>{size}</option>)}</select></label>
      </div>
      <div className="account-two">
        <label><span>Shoes</span><select value={form.shoe || ""} onChange={(event) => setForm({ ...form, shoe: event.target.value })}><option value="">Choose size</option>{["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"].map((size) => <option key={size} value={size}>{size}</option>)}</select></label>
        <Field label="Preferred Color" value={form.color || ""} onChange={(value) => setForm({ ...form, color: value })} />
      </div>
      {status && <p className="account-status">{status}</p>}
      <button type="submit">Save Size Preferences</button>
    </form>
  );
}

function PasswordForm() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [status, setStatus] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (form.newPassword !== form.confirm) {
      setStatus("Passwords do not match.");
      return;
    }
    if (form.newPassword.length < 8 || !/\d/.test(form.newPassword)) {
      setStatus("Password must be at least 8 characters and contain a number.");
      return;
    }
    setStatus("Saving...");
    try {
      await api("/auth/change-password", { method: "PUT", body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }) });
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
      setStatus("Password changed.");
    } catch (err: any) {
      setStatus(err.message);
    }
  }

  return (
    <form className="account-form" onSubmit={submit}>
      <h2>Change Password</h2>
      <Field label="Current Password" type="password" value={form.currentPassword} onChange={(value) => setForm({ ...form, currentPassword: value })} />
      <Field label="New Password" type="password" value={form.newPassword} onChange={(value) => setForm({ ...form, newPassword: value })} />
      <Field label="Confirm Password" type="password" value={form.confirm} onChange={(value) => setForm({ ...form, confirm: value })} />
      {status && <p className="account-status">{status}</p>}
      <button type="submit">Update Password</button>
    </form>
  );
}

function AddressForm({ user, onUser }: { user: User; onUser: (user: User) => void }) {
  const [addresses, setAddresses] = useState<Address[]>(user.addresses || []);
  const [defaultAddress, setDefaultAddress] = useState(user.defaultAddress || 0);
  const [draft, setDraft] = useState<Address>(emptyAddress);
  const [status, setStatus] = useState("");

  async function save(nextAddresses: Address[], nextDefault = defaultAddress) {
    const data = await api<{ user: User }>("/auth/me", { method: "PUT", body: JSON.stringify({ addresses: nextAddresses, defaultAddress: nextDefault }) });
    setAddresses(data.user.addresses || []);
    setDefaultAddress(data.user.defaultAddress || 0);
    onUser(data.user);
  }

  async function add(event: FormEvent) {
    event.preventDefault();
    setStatus("");
    try {
      await save([...addresses, draft], addresses.length ? defaultAddress : 0);
      setDraft(emptyAddress);
      setStatus("Address saved.");
    } catch (err: any) {
      setStatus(err.message);
    }
  }

  async function remove(index: number) {
    const next = addresses.filter((_, itemIndex) => itemIndex !== index);
    await save(next, Math.max(0, Math.min(defaultAddress, next.length - 1)));
  }

  async function makeDefault(index: number) {
    await save(addresses, index);
  }

  return (
    <div className="account-form">
      <h2>Addresses</h2>
      <div className="account-addresses">
        {addresses.map((address, index) => (
          <article key={`${address.line1}-${index}`}>
            <div>
              <strong>{address.fullName}</strong>
              <p>{address.line1}{address.line2 ? `, ${address.line2}` : ""}</p>
              <p>{address.city}, {address.state} {address.postalCode} / {address.phone}</p>
            </div>
            <div>
              {defaultAddress === index ? <span>Default</span> : <button type="button" onClick={() => makeDefault(index)}>Default</button>}
              <button type="button" onClick={() => remove(index)}>Remove</button>
            </div>
          </article>
        ))}
      </div>
      <form onSubmit={add} className="account-nested-form">
        <h3>New Address</h3>
        <div className="account-two">
          <Field label="Full Name" value={draft.fullName} onChange={(value) => setDraft({ ...draft, fullName: value })} />
          <Field label="Phone" value={draft.phone} onChange={(value) => setDraft({ ...draft, phone: value })} />
        </div>
        <Field label="Address Line 1" value={draft.line1} onChange={(value) => setDraft({ ...draft, line1: value })} />
        <Field label="Address Line 2" value={draft.line2 || ""} onChange={(value) => setDraft({ ...draft, line2: value })} />
        <div className="account-two">
          <Field label="City" value={draft.city} onChange={(value) => setDraft({ ...draft, city: value })} />
          <Field label="State / County" value={draft.state} onChange={(value) => setDraft({ ...draft, state: value })} />
        </div>
        <div className="account-two">
          <Field label="Postal Code" value={draft.postalCode} onChange={(value) => setDraft({ ...draft, postalCode: value })} />
          <label><span>Country</span><select value={draft.country} onChange={(event) => setDraft({ ...draft, country: event.target.value })}><option value="KE">Kenya</option><option value="UG">Uganda</option><option value="TZ">Tanzania</option><option value="RW">Rwanda</option><option value="US">United States</option></select></label>
        </div>
        {status && <p className="account-status">{status}</p>}
        <button type="submit">Save Address</button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
