import { AuthForm } from "@/components/forms";
import { PageHero, SiteChrome } from "@/components/site-chrome";

export default function RegisterPage() {
  return (
    <SiteChrome>
      <PageHero eyebrow="New customer" title="Create Account" copy="Create an account for faster checkout, saved pieces, and order updates." />
      <AuthForm mode="register" />
    </SiteChrome>
  );
}
