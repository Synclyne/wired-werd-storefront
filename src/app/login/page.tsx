import { AuthForm } from "@/components/forms";
import { PageHero, SiteChrome } from "@/components/site-chrome";

export default function LoginPage() {
  return (
    <SiteChrome>
      <PageHero eyebrow="Secure access" title="Login" copy="Sign into your account to manage orders, favorites, and checkout details." />
      <AuthForm mode="login" />
    </SiteChrome>
  );
}
