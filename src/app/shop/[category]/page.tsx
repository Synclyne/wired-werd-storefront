import { SiteChrome } from "@/components/site-chrome";
import { ShopView } from "@/components/shop-view";

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const label = decodeURIComponent(category);
  return (
    <SiteChrome>
      <ShopView useLiveData initialCategory={label} />
    </SiteChrome>
  );
}
