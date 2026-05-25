"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/types";
import { AddToCartButton } from "@/components/cart-provider";
import { WishlistButton } from "@/components/wishlist-button";

function formatCurrency(value: number) {
  return `KSh ${Number(value || 0).toLocaleString()}`;
}

function productTag(product: Product, index: number) {
  if (product.badge) return product.badge;
  if (index % 5 === 1) return "New";
  if (index % 3 === 2) return "Sale";
  if (index % 7 === 4) return "Bestseller";
  return "";
}

function discountFor(product: Product, index: number) {
  const tag = productTag(product, index).toLowerCase();
  return tag.includes("sale") || index % 3 === 2 ? 20 + (index % 4) * 3 : 0;
}

export function ShopView({ products, initialCategory = "All", initialFitSlugs = [] }: { products: Product[]; initialCategory?: string; initialFitSlugs?: string[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [tag, setTag] = useState("All");
  const [gender, setGender] = useState("All");
  const [maxPrice, setMaxPrice] = useState(50000);
  const [sort, setSort] = useState("newest");
  const categories = ["All", ...Array.from(new Set(products.map((product) => product.category).filter(Boolean)))];
  const tags = ["All", "New", "Limited", "Bestseller", "Sale"];
  const genders = ["All", "Men", "Women", "Unisex"];
  const fitSet = useMemo(() => new Set(initialFitSlugs.map((item) => item.toLowerCase())), [initialFitSlugs]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = products.filter((product, index) => {
      const matchesFit = !fitSet.size || fitSet.has(product.slug.toLowerCase()) || fitSet.has(product.id.toLowerCase()) || (product.productId && fitSet.has(product.productId.toLowerCase()));
      const matchesCategory = category === "All" || product.category.toLowerCase() === category.toLowerCase();
      const badge = productTag(product, index).toLowerCase();
      const matchesTag = tag === "All" || badge.includes(tag.toLowerCase());
      const matchesGender = gender === "All" || [product.name, product.category, product.description].join(" ").toLowerCase().includes(gender.toLowerCase());
      const matchesPrice = Number(product.price || 0) <= maxPrice;
      const matchesQuery = !needle || [product.name, product.category, product.description].join(" ").toLowerCase().includes(needle);
      return matchesFit && matchesCategory && matchesTag && matchesGender && matchesPrice && matchesQuery;
    });
    return [...filtered].sort((a, b) => {
      if (sort === "price-low") return a.price - b.price;
      if (sort === "price-high") return b.price - a.price;
      if (sort === "name") return a.name.localeCompare(b.name);
      return 0;
    });
  }, [category, fitSet, gender, maxPrice, products, query, sort, tag]);

  return (
    <section className="shop-board">
      <aside className="shop-filter-rail" aria-label="Shop filters">
        <label className="shop-search">
          <Search size={15} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" />
        </label>
        <FilterGroup title="Category" items={categories} active={category} onSelect={setCategory} />
        <FilterGroup title="Tags" items={tags} active={tag} onSelect={setTag} />
        <FilterGroup title="Gender" items={genders} active={gender} onSelect={setGender} />
        <div className="shop-filter-group">
          <h2>Max Price</h2>
          <input type="range" min={1000} max={50000} step={500} value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} />
          <strong>{formatCurrency(maxPrice)}</strong>
        </div>
      </aside>

      <div className="shop-catalog-panel">
        <div className="shop-sort-row">
          <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products">
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name">Name</option>
          </select>
        </div>
        <div className="catalog-grid">
          {visible.length === 0 && <p className="shop-empty">No products match these filters.</p>}
          {visible.map((product, index) => {
            const badge = productTag(product, index);
            const discount = discountFor(product, index);
            const oldPrice = discount ? Math.round(product.price / (1 - discount / 100)) : 0;
            return (
              <article className="catalog-card" key={product.id}>
                <Link href={`/product/${product.slug}`} className="catalog-image">
                  <img src={product.image} alt={product.name} />
                  {badge && <span className={`catalog-badge ${badge.toLowerCase()}`}>{badge}</span>}
                  {discount > 0 && <span className="catalog-discount">-{discount}%</span>}
                  <WishlistButton productId={product.productId || product.id} label={`Save ${product.name}`} />
                </Link>
                <h2><Link href={`/product/${product.slug}`}>{product.name}</Link></h2>
                <div className="catalog-price-row">
                  <div>
                    <strong>{formatCurrency(product.price)}</strong>
                    {oldPrice > 0 && <s>{formatCurrency(oldPrice)}</s>}
                  </div>
                  <AddToCartButton className="catalog-cart-button" product={product} ariaLabel={`Quick add ${product.name}`}><ShoppingBag size={16} /></AddToCartButton>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FilterGroup({ title, items, active, onSelect }: { title: string; items: string[]; active: string; onSelect: (value: string) => void }) {
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
