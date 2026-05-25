"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin-client";

type Variant = { _id?: string; size: string; color: string; colorHex: string; stock: number; sku?: string };
type ImageItem = { url: string; alt?: string; isPrimary?: boolean };
type ProductForm = {
  name: string;
  slug: string;
  description: string;
  details: string;
  price: string | number;
  comparePrice: string | number | null;
  category: string;
  gender: string;
  badge: string;
  isFeatured: boolean;
  isPublished: boolean;
  images: ImageItem[];
  variants: Variant[];
};

const categories = ["hoodie", "sweatshirt", "outwear", "athletic", "shoes", "accessories"];
const genders = ["men", "women", "unisex", "kids"];
const badges = ["", "bestseller", "new", "sale", "limited"];
const clothingSizes = ["XS", "S", "M", "L", "XL", "XXL"];
const shoeSizes = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"];

const emptyProduct: ProductForm = {
  name: "",
  slug: "",
  description: "",
  details: "",
  price: "",
  comparePrice: "",
  category: "hoodie",
  gender: "unisex",
  badge: "",
  isFeatured: false,
  isPublished: true,
  images: [],
  variants: []
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function AdminProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const isNew = !productId;
  const [form, setForm] = useState<ProductForm>(emptyProduct);
  const [variant, setVariant] = useState<Variant>({ size: "M", color: "", colorHex: "#000000", stock: 0, sku: "" });
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!productId) return;
    adminFetch<{ product: ProductForm }>(`/admin/products/${productId}`)
      .then((data) => setForm({ ...emptyProduct, ...data.product, price: data.product.price || "", comparePrice: data.product.comparePrice || "" }))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [productId]);

  function setField<K extends keyof ProductForm>(key: K, value: ProductForm[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "name" && isNew) next.slug = slugify(String(value));
      if (key === "category") {
        setVariant((old) => ({ ...old, size: value === "shoes" ? "40" : "M" }));
      }
      return next;
    });
  }

  function addVariant() {
    if (!variant.color.trim()) {
      setError("Colour is required.");
      return;
    }
    const { _id, ...cleanVariant } = variant;
    setForm((current) => ({ ...current, variants: [...current.variants, { ...cleanVariant, stock: Number(cleanVariant.stock || 0) }] }));
    setVariant({ size: form.category === "shoes" ? "40" : "M", color: "", colorHex: "#000000", stock: 0, sku: "" });
    setError("");
  }

  function addImage(url: string) {
    const clean = url.trim();
    if (!clean) return;
    setForm((current) => ({ ...current, images: [...current.images, { url: clean, alt: current.name, isPrimary: current.images.length === 0 }] }));
    setImageUrl("");
  }

  async function uploadImages(files: FileList | null) {
    if (!files?.length) return;
    const data = new FormData();
    Array.from(files).forEach((file) => data.append("images", file));
    const response = await fetch("/api/backend/admin/upload", { method: "POST", body: data });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.error || "Upload failed. Add Cloudinary keys or paste an image URL.");
      return;
    }
    (payload.urls || []).forEach((url: string) => addImage(url));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
        variants: form.variants.map(({ _id, ...item }) => ({ ...item, stock: Number(item.stock || 0) }))
      };
      if (isNew) {
        const data = await adminFetch<{ product: { _id: string } }>("/admin/products", { method: "POST", body: JSON.stringify(payload) });
        setSuccess("Product created.");
        router.replace(`/admin/products/${data.product._id}/edit`);
      } else {
        await adminFetch(`/admin/products/${productId}`, { method: "PUT", body: JSON.stringify(payload) });
        setSuccess("Product saved.");
      }
    } catch (err: any) {
      setError(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="admin-loading">Loading product...</div>;

  return (
    <div className="admin-functional-page">
      <div className="admin-functional-header">
        <div><p>Products</p><h1>{isNew ? "New Product" : "Edit Product"}</h1>{form.name && <span>{form.name}</span>}</div>
        <div><Link href="/admin/products">Products</Link>{!isNew && <Link href={`/product/${form.slug}`} target="_blank">View</Link>}</div>
      </div>
      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-loading">{success}</div>}
      <form className="admin-product-form" onSubmit={submit}>
        <section>
          <h2>Basic Info</h2>
          <Field label="Product Name" value={form.name} onChange={(value) => setField("name", value)} />
          <Field label="Slug (URL)" value={form.slug} onChange={(value) => setField("slug", slugify(value))} />
          <label><span>Description</span><textarea value={form.description} onChange={(event) => setField("description", event.target.value)} rows={5} /></label>
          <label><span>Details & Fit</span><textarea value={form.details} onChange={(event) => setField("details", event.target.value)} rows={4} /></label>
        </section>
        <section>
          <h2>Pricing</h2>
          <div className="admin-product-two">
            <Field label="Price (KSh)" type="number" value={String(form.price || "")} onChange={(value) => setField("price", value)} />
            <Field label="Compare Price" type="number" value={String(form.comparePrice || "")} onChange={(value) => setField("comparePrice", value)} />
          </div>
        </section>
        <section>
          <h2>Organisation</h2>
          <div className="admin-product-three">
            <SelectField label="Category" value={form.category} options={categories} onChange={(value) => setField("category", value)} />
            <SelectField label="Gender" value={form.gender} options={genders} onChange={(value) => setField("gender", value)} />
            <SelectField label="Badge" value={form.badge} options={badges} onChange={(value) => setField("badge", value)} />
          </div>
          <label className="admin-check"><input type="checkbox" checked={form.isPublished} onChange={(event) => setField("isPublished", event.target.checked)} />Published</label>
          <label className="admin-check"><input type="checkbox" checked={form.isFeatured} onChange={(event) => setField("isFeatured", event.target.checked)} />Featured on homepage</label>
        </section>
        <section>
          <h2>Variants</h2>
          <div className="admin-variant-list">
            {form.variants.map((item, index) => (
              <article key={`${item.size}-${item.color}-${index}`}>
                <span style={{ background: item.colorHex }} />
                <strong>{item.size} / {item.color}</strong>
                <input type="number" value={item.stock} onChange={(event) => setForm((current) => ({ ...current, variants: current.variants.map((old, i) => i === index ? { ...old, stock: Number(event.target.value) } : old) }))} />
                <button type="button" onClick={() => setForm((current) => ({ ...current, variants: current.variants.filter((_, i) => i !== index) }))}>Remove</button>
              </article>
            ))}
          </div>
          <div className="admin-add-variant">
            <select value={variant.size} onChange={(event) => setVariant({ ...variant, size: event.target.value })}>{(form.category === "shoes" ? shoeSizes : clothingSizes).map((size) => <option key={size}>{size}</option>)}</select>
            <input placeholder="Colour" value={variant.color} onChange={(event) => setVariant({ ...variant, color: event.target.value })} />
            <input type="color" value={variant.colorHex} onChange={(event) => setVariant({ ...variant, colorHex: event.target.value })} />
            <input type="number" min="0" placeholder="Stock" value={variant.stock} onChange={(event) => setVariant({ ...variant, stock: Number(event.target.value) })} />
            <input placeholder="SKU" value={variant.sku} onChange={(event) => setVariant({ ...variant, sku: event.target.value })} />
            <button type="button" onClick={addVariant}>Add Variant</button>
          </div>
        </section>
        <section>
          <h2>Images</h2>
          <div className="admin-image-list">
            {form.images.map((image, index) => (
              <article key={`${image.url}-${index}`}>
                <img src={image.url} alt="" />
                <p>{image.url}</p>
                {image.isPrimary ? <span>Primary</span> : <button type="button" onClick={() => setForm((current) => ({ ...current, images: current.images.map((img, i) => ({ ...img, isPrimary: i === index })) }))}>Set Primary</button>}
                <button type="button" onClick={() => setForm((current) => ({ ...current, images: current.images.filter((_, i) => i !== index) }))}>Remove</button>
              </article>
            ))}
          </div>
          <div className="admin-image-add">
            <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="Paste image link..." />
            <button type="button" onClick={() => addImage(imageUrl)}>Add Link</button>
            <label>Upload From Device<input type="file" accept="image/*" multiple onChange={(event) => uploadImages(event.target.files)} /></label>
          </div>
        </section>
        <button className="admin-product-save" type="submit" disabled={saving}>{saving ? "Saving..." : isNew ? "Create Product" : "Save Changes"}</button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={label !== "Compare Price"} /></label>;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option value={option} key={option}>{option || "None"}</option>)}</select></label>;
}
