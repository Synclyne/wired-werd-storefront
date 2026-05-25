import { getProductBySlug, getProducts } from "@/lib/api";
import { SiteChrome } from "@/components/site-chrome";
import { ShopView } from "@/components/shop-view";
import { ProductDetailClient } from "@/components/product-detail-client";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  const related = await getProducts({ category: product.category, limit: 4 });

  return (
    <SiteChrome>
      <ProductDetailClient product={product} />
      <ShopView products={related} initialCategory={product.category} />
    </SiteChrome>
  );
}
