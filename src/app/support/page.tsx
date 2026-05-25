import { SupportForm } from "@/components/forms";
import { PageHero, SiteChrome } from "@/components/site-chrome";

export default function SupportPage() {
  return (
    <SiteChrome>
      <PageHero eyebrow="Support" title="Customer Support" copy="Questions about drops, shipping, returns, and order status." />
      <SupportForm />
    </SiteChrome>
  );
}
