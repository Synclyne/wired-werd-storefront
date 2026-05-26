import { SiteChrome } from "@/components/site-chrome";
import { ShopView } from "@/components/shop-view";

export default async function ShopPage({ searchParams }: { searchParams?: Promise<{ fit?: string; category?: string }> }) {
  const params = await searchParams;
  const fitSlugs = (params?.fit || "").split(",").map((item) => decodeURIComponent(item).trim()).filter(Boolean);
  const initialCategory = params?.category ? decodeURIComponent(params.category) : "All";
  return (
    <SiteChrome>
      <ShopView useLiveData initialCategory={initialCategory} initialFitSlugs={fitSlugs} />
    </SiteChrome>
  );
}
