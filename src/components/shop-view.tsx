"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, ShoppingBag, SlidersHorizontal, X } from "lucide-react";
import type { Product } from "@/lib/types";
import { AddToCartButton } from "@/components/cart-provider";
import { WishlistButton } from "@/components/wishlist-button";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
  { value: "popular", label: "Most Popular" },
];
const BADGES = ["All", "New", "Limited", "Bestseller", "Sale"];
const GENDERS = ["All", "Men", "Women", "Unisex"];

function fmt(value: number) {
  return `KSh ${Number(value || 0).toLocaleString()}`;
}

function normalizeRaw(item: Record<string, unknown>, index: number): Product {
  const rawImages = Array.isArray(item.images) ? (item.images as { url?: string; alt?: string; isPrimary?: boolean }[]) : [];
  const images = rawImages.map((img) => ({ ...img, url: img.url || "" }));
  const primaryImage = images.find((img) => img.isPrimary) || images[0];
  const image = primaryImage?.url || String(item.image || item.imageUrl || "");
  const id = String(item.id || item._id || "");
  const variants = Array.isArray(item.variants) ? (item.variants as Record<string, unknown>[]) : [];
  const firstVariant = variants.find((v) => Number(v.stock || 0) > 0) || variants[0];
  return {
    id,
    productId: String(item._id || item.id || ""),
    name: String(item.name || `Product ${index + 1}`),
    slug: String(item.slug || id),
    category: String(item.category || ""),
    description: String(item.description || ""),
    price: Number(item.price || 0),
    comparePrice: item.comparePrice ? Number(item.comparePrice) : null,
    image,
    images,
    badge: String(item.badge || ""),
    variantId: firstVariant ? String(firstVariant._id || firstVariant.id || "") : undefined,
    size: firstVariant ? String(firstVariant.size || "") : "",
    color: firstVariant ? String(firstVariant.color || "") : "",
    sizes: variants.map((v) => String(v.size || "")).filter(Boolean),
    colors: variants.map((v) => String(v.color || "")).filter(Boolean),
    variants: variants.map((v) => ({
      _id: String(v._id || v.id || ""),
      id: String(v.id || v._id || ""),
      size: String(v.size || ""),
      color: String(v.color || ""),
      colorHex: String(v.colorHex || "#000"),
      stock: Number(v.stock || 0),
    })),
    totalStock: variants.reduce((sum, v) => sum + Number(v.stock || 0), 0) || Number(item.totalStock || 0),
    rating: Number(item.rating || 0),
    numReviews: Number(item.numReviews || 0),
  };
}

export function ShopView({
  products: passedProducts,
  initialCategory = "All",
  initialFitSlugs = [],
  useLiveData = false,
}: {
  products?: Product[];
  initialCategory?: string;
  initialFitSlugs?: string[];
  useLiveData?: boolean;
}) {
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(useLiveData);
  const [priceCap, setPriceCap] = useState(50000);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [tag, setTag] = useState("All");
  const [gender, setGender] = useState("All");
  const [maxPrice, setMaxPrice] = useState(50000);
  const [sort, setSort] = useState("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const fetchRef = useRef(0);

  useEffect(() => {
    if (!useLiveData) return;
    fetch("/api/backend/products/meta/price-range")
      .then((r) => r.json())
      .then((data) => {
        const cap = Math.ceil(Number(data.maxPrice || 50000) / 1000) * 1000;
        setPriceCap(cap);
        setMaxPrice(cap);
      })
      .catch(() => {});
  }, [useLiveData]);

  useEffect(() => {
    if (!useLiveData) return;
    const id = ++fetchRef.current;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "12", sort });
    if (category !== "All") params.set("category", category.toLowerCase());
    if (gender !== "All") params.set("gender", gender.toLowerCase());
    if (tag !== "All") params.set("badge", tag.toLowerCase());
    if (maxPrice < priceCap) params.set("maxPrice", String(maxPrice));
    if (query.trim()) params.set("search", query.trim());
    fetch(`/api/backend/products?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (id !== fetchRef.current) return;
        const raw: Product[] = (data.products || []).map((item: Record<string, unknown>, i: number) => normalizeRaw(item, i));
        setLiveProducts(raw);
        setTotal(data.pagination?.total ?? raw.length);
        setPages(data.pagination?.pages ?? 1);
        const cats = Array.from(new Set(raw.map((p) => p.category).filter(Boolean)));
        if (cats.length) setCategories(cats);
        setLoading(false);
      })
      .catch(() => { if (id === fetchRef.current) setLoading(false); });
  }, [useLiveData, category, tag, gender, maxPrice, priceCap, sort, page, query]);

  function resetPage() { setPage(1); }

  const fitSet = useMemo(() => new Set(initialFitSlugs.map((s) => s.toLowerCase())), [initialFitSlugs]);

  const products = useLiveData ? liveProducts : (passedProducts || []);

  const displayCategories = useLiveData
    ? ["All", ...categories]
    : ["All", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];

  const visible = useMemo(() => {
    if (useLiveData) return products;
    const needle = query.trim().toLowerCase();
    return products.filter((p, i) => {
      const badge = (p.badge || "").toLowerCase();
      const matchFit = !fitSet.size || fitSet.has(p.slug.toLowerCase()) || fitSet.has(p.id.toLowerCase()) || (p.productId ? fitSet.has(p.productId.toLowerCase()) : false);
      const matchCat = category === "All" || p.category.toLowerCase() === category.toLowerCase();
      const matchTag = tag === "All" || badge.includes(tag.toLowerCase());
      const matchGender = gender === "All" || [p.name, p.category, p.description].join(" ").toLowerCase().includes(gender.toLowerCase());
      const matchPrice = Number(p.price || 0) <= maxPrice;
      const matchQuery = !needle || [p.name, p.category, p.description].join(" ").toLowerCase().includes(needle);
      return matchFit && matchCat && matchTag && matchGender && matchPrice && matchQuery;
    });
  }, [products, useLiveData, fitSet, category, tag, gender, maxPrice, query]);

  const FiltersContent = (
    <div className="shop-filter-body">
      <FilterGroup title="Tags" items={BADGES} active={tag} onSelect={(v) => { setTag(v); resetPage(); setFiltersOpen(false); }} />
      <FilterGroup title="Gender" items={GENDERS} active={gender} onSelect={(v) => { setGender(v); resetPage(); }} />
      <button className="shop-clear-btn" type="button" onClick={() => { setCategory("All"); setTag("All"); setGender("All"); setMaxPrice(priceCap); resetPage(); }}>
        Clear Filters
      </button>
    </div>
  );

  return (
    <section className="shop-board">
      <aside className="shop-filter-rail" aria-label="Shop filters">
        <label className="shop-search">
          <Search size={15} />
          <input value={query} onChange={(e) => { setQuery(e.target.value); resetPage(); }} placeholder="Search" />
        </label>
        {FiltersContent}
      </aside>

      <div className="shop-catalog-panel">
        {/* Category + price banner — shown instead of a hero at the top of the shop */}
        <div className="shop-cat-banner">
          <div className="shop-cat-pills">
            {displayCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={cat === category ? "active" : ""}
                onClick={() => { setCategory(cat); resetPage(); }}
              >{cat}</button>
            ))}
          </div>
          <div className="shop-cat-price">
            <label htmlFor="shop-price-range">Max price</label>
            <input id="shop-price-range" type="range" min={1000} max={priceCap} step={500} value={maxPrice} onChange={(e) => { setMaxPrice(Number(e.target.value)); resetPage(); }} />
            <strong>{fmt(maxPrice)}</strong>
          </div>
        </div>

        <div className="shop-sort-row">
          {useLiveData && (
            <span className="shop-count">{total > 0 ? `${total} product${total !== 1 ? "s" : ""}` : ""}</span>
          )}
          <select value={sort} onChange={(e) => { setSort(e.target.value); resetPage(); }} aria-label="Sort products">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button className="shop-filter-toggle" type="button" onClick={() => setFiltersOpen(true)} aria-label="Open filters">
            <SlidersHorizontal size={14} /> Filters
          </button>
        </div>

        {loading ? (
          <div className="shop-loading">
            {Array.from({ length: 12 }).map((_, i) => <div className="shop-skeleton" key={i} />)}
          </div>
        ) : visible.length === 0 ? (
          <p className="shop-empty">No products match these filters.</p>
        ) : (
          <div className="catalog-grid">
            {visible.map((product) => {
              const comparePrice = product.comparePrice || 0;
              const discount = comparePrice > product.price ? Math.round((1 - product.price / comparePrice) * 100) : 0;
              const badge = product.badge || "";
              return (
                <article className="catalog-card" key={product.id}>
                  <Link href={`/product/${product.slug}`} className="catalog-image">
                    <img src={product.image} alt={product.name} loading="lazy" />
                    {badge && <span className={`catalog-badge ${badge.toLowerCase()}`}>{badge}</span>}
                    {discount > 0 && <span className="catalog-discount">-{discount}%</span>}
                    <WishlistButton productId={product.productId || product.id} label={`Save ${product.name}`} />
                  </Link>
                  <div className="catalog-quick-row">
                    <AddToCartButton className="catalog-cart-button" product={product} ariaLabel={`Quick add ${product.name}`}>
                      Quick Add
                    </AddToCartButton>
                  </div>
                  <h2><Link href={`/product/${product.slug}`}>{product.name}</Link></h2>
                  <div className="catalog-price-row">
                    <strong>{fmt(product.price)}</strong>
                    {comparePrice > product.price && <s>{fmt(comparePrice)}</s>}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {useLiveData && pages > 1 && (
          <div className="shop-pagination">
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={p === page ? "active" : ""}
                type="button"
                onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              >{p}</button>
            ))}
          </div>
        )}
      </div>

      {filtersOpen && (
        <>
          <div className="shop-filter-overlay" onClick={() => setFiltersOpen(false)} />
          <div className="shop-filter-sheet" role="dialog" aria-label="Filters">
            <div className="shop-filter-sheet-head">
              <span>Filters</span>
              <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X size={18} /></button>
            </div>
            {FiltersContent}
          </div>
        </>
      )}
    </section>
  );
}

function FilterGroup({ title, items, active, onSelect }: { title: string; items: string[]; active: string; onSelect: (v: string) => void }) {
  return (
    <div className="shop-filter-group">
      <h2>{title}</h2>
      {items.map((item) => (
        <button className={item === active ? "active" : ""} type="button" key={item} onClick={() => onSelect(item)}>
          {item}
        </button>
      ))}
    </div>
  );
}
