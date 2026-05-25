import { getProducts } from "@/lib/api";
import { SiteChrome } from "@/components/site-chrome";
import { ShopView } from "@/components/shop-view";

export default async function ShopPage({ searchParams }: { searchParams?: Promise<{ fit?: string }> }) {
  const params = await searchParams;
  const fitSlugs = (params?.fit || "").split(",").map((item) => decodeURIComponent(item).trim()).filter(Boolean);
  const products = await getProducts({ limit: fitSlugs.length ? 100 : 24 });
  return (
    <SiteChrome>
      <ShopView products={products} initialFitSlugs={fitSlugs} />
    </SiteChrome>
  );
}
