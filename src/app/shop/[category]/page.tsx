import { getProducts } from "@/lib/api";
import { SiteChrome } from "@/components/site-chrome";
import { ShopView } from "@/components/shop-view";

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const label = decodeURIComponent(category);
  const products = await getProducts({ category: label, limit: 24 });
  return (
    <SiteChrome>
      <ShopView products={products} initialCategory={label} />
    </SiteChrome>
  );
}
