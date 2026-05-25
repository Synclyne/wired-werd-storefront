import { notFound } from "next/navigation";
import { PageHero, SiteChrome } from "@/components/site-chrome";
import { policyCopy } from "@/lib/page-data";

export default async function PolicyPage({ params }: { params: Promise<{ policy: string }> }) {
  const { policy } = await params;
  const copy = policyCopy[policy as keyof typeof policyCopy];
  if (!copy) notFound();

  return (
    <SiteChrome>
      <PageHero eyebrow="Policy" title={copy.title} copy={copy.kicker} />
      <section className="policy-panel">
        {copy.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </section>
    </SiteChrome>
  );
}
