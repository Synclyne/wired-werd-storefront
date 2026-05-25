import { getHomepageData } from "@/lib/api";
import { Storefront } from "@/components/storefront";

export default async function Home() {
  const data = await getHomepageData();
  return <Storefront products={data.products} featured={data.featured} homepage={data.homepage} />;
}
