import { AuthForm } from "@/components/forms";
import { PageHero, SiteChrome } from "@/components/site-chrome";

export default function ResetPasswordPage() {
  return (
    <SiteChrome>
      <PageHero eyebrow="Recovery" title="Reset Password" copy="Set a new password after validating the reset token." />
      <AuthForm mode="reset" />
    </SiteChrome>
  );
}
