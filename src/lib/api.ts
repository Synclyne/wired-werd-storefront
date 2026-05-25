import type { HomepageConfig, HomepagePayload, Product } from "@/lib/types";
import { backendPath } from "@/lib/backend";

const editorialImages = [
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1100&q=85",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1506629905607-d9f297d33b64?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1551489186-cf8726f514f8?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=85"
];

const fallbackProducts: Product[] = [
  {
    id: "urban-jacket",
    name: "Urban Jacket",
    slug: "urban-jacket",
    category: "Jackets",
    description: "Vintage green technical jacket",
    price: 144.99,
    image: editorialImages[1],
    badge: "Jackets"
  },
  {
    id: "retro-glasses",
    name: "Retro Glasses",
    slug: "retro-glasses",
    category: "Glasses",
    description: "Chrome wraparound eyewear",
    price: 52.99,
    image: editorialImages[2],
    badge: "Glasses"
  },
  {
    id: "solo-swoosh",
    name: "Solo Swoosh Pants",
    slug: "solo-swoosh",
    category: "Pants",
    description: "Relaxed fleece trousers",
    price: 99.99,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85",
    badge: "Pants"
  },
  {
    id: "sportswear-hoodie",
    name: "Sportswear Windrunner",
    slug: "sportswear-hoodie",
    category: "Jackets",
    description: "Men's full-zip hoodie",
    price: 109.99,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85",
    badge: "Jackets"
  },
  {
    id: "modern-bag",
    name: "Brown Modern Bag",
    slug: "modern-bag",
    category: "Handbags",
    description: "Structured leather daily bag",
    price: 235.99,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85",
    badge: "Handbags"
  },
  {
    id: "relaxed-tee",
    name: "Relaxed-Fit T-Shirt",
    slug: "relaxed-tee",
    category: "T-Shirt",
    description: "Organic cotton jersey",
    price: 1035.99,
    image: "https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=900&q=85",
    badge: "T-Shirt"
  },
  {
    id: "wired-runner",
    name: "Wired Runner 01",
    slug: "wired-runner-01",
    category: "Shoes",
    description: "Rounded everyday sneaker with a soft street sole",
    price: 3800,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85",
    badge: "Shoes",
    size: "42",
    color: "White",
    sizes: ["40", "41", "42", "43", "44"],
    colors: ["White", "Black"]
  },
  {
    id: "night-court-low",
    name: "Night Court Low",
    slug: "night-court-low",
    category: "Shoes",
    description: "Low-profile black sneaker for complete fits",
    price: 4200,
    image: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=900&q=85",
    badge: "Shoes",
    size: "42",
    color: "Black",
    sizes: ["40", "41", "42", "43", "44", "45"],
    colors: ["Black"]
  }
];

function moneyToNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace(/[^\d.]/g, "")) || 0;
  return 0;
}

function normalizeProduct(item: Record<string, unknown>, index: number): Product {
  const name = String(item.name || item.title || `Streetwear Piece ${index + 1}`);
  const rawImages = Array.isArray(item.images) ? (item.images as Record<string, unknown>[]) : [];
  const images = rawImages
    .map((imageItem) => ({
      url: String(imageItem.url || ""),
      alt: String(imageItem.alt || name),
      isPrimary: Boolean(imageItem.isPrimary)
    }))
    .filter((imageItem) => imageItem.url);
  const rawImage = item.image || item.imageUrl || item.thumbnail || item.cover || item.images;
  const image = images.find((imageItem) => imageItem.isPrimary)?.url || images[0]?.url || (Array.isArray(rawImage)
    ? typeof rawImage[0] === "object" && rawImage[0] !== null
      ? String((rawImage[0] as Record<string, unknown>).url || editorialImages[index % editorialImages.length])
      : String(rawImage[0] || editorialImages[index % editorialImages.length])
    : String(rawImage || editorialImages[index % editorialImages.length]));
  const productId = String(item._id || item.id || "");
  const id = String(item.id || item._id || item.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  const variants = Array.isArray(item.variants) ? (item.variants as Record<string, unknown>[]) : [];
  const firstVariant = variants.find((variant) => Number(variant.stock || 0) > 0) || variants[0];
  const reviews = Array.isArray(item.reviews) ? (item.reviews as Record<string, unknown>[]).map((review) => ({
    _id: String(review._id || review.id || ""),
    id: String(review.id || review._id || ""),
    name: String(review.name || "Customer"),
    rating: Number(review.rating || 0),
    comment: String(review.comment || ""),
    createdAt: String(review.createdAt || "")
  })) : [];

  return {
    id,
    productId,
    name,
    slug: String(item.slug || id),
    category: String(item.category || item.type || "New Arrival"),
    gender: String(item.gender || "unisex"),
    description: String(item.description || item.subtitle || "Limited streetwear selection"),
    details: String(item.details || ""),
    price: moneyToNumber(item.price || item.salePrice || item.amount),
    comparePrice: item.comparePrice ? moneyToNumber(item.comparePrice) : null,
    image,
    images,
    badge: String(item.badge || item.category || item.type || "Drop"),
    variantId: firstVariant ? String(firstVariant._id || firstVariant.id || "") : undefined,
    size: firstVariant ? String(firstVariant.size || "One Size") : "One Size",
    color: firstVariant ? String(firstVariant.color || "Default") : "Default",
    sizes: Array.isArray(item.sizes) ? item.sizes.map(String) : variants.map((variant) => String(variant.size || "")).filter(Boolean),
    colors: Array.isArray(item.colors) ? item.colors.map(String) : variants.map((variant) => String(variant.color || "")).filter(Boolean),
    variants: variants.map((variant) => ({
      _id: String(variant._id || variant.id || ""),
      id: String(variant.id || variant._id || ""),
      size: String(variant.size || ""),
      color: String(variant.color || ""),
      colorHex: String(variant.colorHex || "#000000"),
      stock: Number(variant.stock || 0),
      sku: String(variant.sku || "")
    })),
    rating: Number(item.rating || 0),
    numReviews: Number(item.numReviews || reviews.length || 0),
    totalStock: Number(item.totalStock || variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0)),
    reviews
  };
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(backendPath(path), {
      ...init,
      next: { revalidate: 60 },
      headers: {
        Accept: "application/json",
        ...init?.headers
      }
    });

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function pickProducts(payload: unknown): Product[] {
  const source = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { products?: unknown[] })?.products)
      ? (payload as { products: unknown[] }).products
      : Array.isArray((payload as { data?: unknown[] })?.data)
        ? (payload as { data: unknown[] }).data
        : [];

  return source.map((item, index) => normalizeProduct(item as Record<string, unknown>, index));
}

export async function getHomepageData(): Promise<HomepagePayload> {
  const [productsPayload, featuredPayload, homepagePayload] = await Promise.all([
    fetchJson<unknown>("/api/products?limit=9"),
    fetchJson<unknown>("/api/products/featured"),
    fetchJson<{ config?: HomepageConfig }>("/api/homepage")
  ]);

  const products = pickProducts(productsPayload);
  const featured = pickProducts(featuredPayload);
  const resolvedProducts = products.length ? products : fallbackProducts;

  return {
    products: resolvedProducts,
    featured: featured.length ? featured.slice(0, 3) : resolvedProducts.slice(0, 3),
    homepage: homepagePayload?.config || null
  };
}

export async function getProducts(params: Record<string, string | number | undefined> = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  const payload = await fetchJson<unknown>(`/api/products${query.size ? `?${query.toString()}` : ""}`);
  const products = pickProducts(payload);
  return products.length ? products : fallbackProducts;
}

export async function getProductBySlug(slug: string) {
  const payload = await fetchJson<{ product?: Record<string, unknown> }>(`/api/products/${encodeURIComponent(slug)}`);
  if (payload?.product) return normalizeProduct(payload.product, 0);
  return fallbackProducts.find((product) => product.slug === slug || product.id === slug) || fallbackProducts[0];
}
