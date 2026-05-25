import { AuthForm } from "@/components/forms";
import { PageHero, SiteChrome } from "@/components/site-chrome";

export default function ForgotPasswordPage() {
  return (
    <SiteChrome>
      <PageHero eyebrow="Recovery" title="Forgot Password" copy="Enter your email and we will help you get back into your account." />
      <AuthForm mode="forgot" />
    </SiteChrome>
  );
}
