"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function AuthForm({ mode }: { mode: "login" | "register" | "forgot" | "reset" }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const isLogin = mode === "login";
  const title = { login: "Login", register: "Create Account", forgot: "Reset Link", reset: "New Password" }[mode];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage("");
    startTransition(async () => {
      if (!isLogin) {
        setMessage(mode === "register" ? "Account requests are opening soon." : "If an account exists for this email, recovery instructions will be sent.");
        return;
      }
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") })
      });
      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        setMessage("Signed in securely.");
        const role = payload.user?.role;
        router.replace(role === "admin" ? "/admin" : "/");
        router.refresh();
        return;
      }
      setMessage(payload.message || payload.error || "Could not sign in.");
    });
  }

  return (
    <form className="glass-form" onSubmit={submit}>
      <h2>{title}</h2>
      {mode === "register" && (
        <div className="form-grid">
          <input name="firstName" placeholder="First name" autoComplete="given-name" required />
          <input name="lastName" placeholder="Last name" autoComplete="family-name" required />
        </div>
      )}
      <input name="email" type="email" placeholder="Email" autoComplete="email" required />
      {mode !== "forgot" && <input name="password" type="password" placeholder="Password" autoComplete={isLogin ? "current-password" : "new-password"} required />}
      {mode === "reset" && <input name="confirmPassword" type="password" placeholder="Confirm password" autoComplete="new-password" required />}
      <button type="submit" disabled={isPending}>{isPending ? "Working..." : title}</button>
      {message && <p>{message}</p>}
      <div className="form-links">
        {!isLogin && <Link href="/login">Back to login</Link>}
        {isLogin && <Link href="/forgot-password">Forgot password?</Link>}
        {isLogin && <Link href="/register">Create account</Link>}
      </div>
    </form>
  );
}

export function SupportForm() {
  const [message, setMessage] = useState("");
  const [ticket, setTicket] = useState<any>(null);
  const [ticketToken, setTicketToken] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ticketId = params.get("ticket");
    const token = params.get("token");
    if (!ticketId || !token) return;
    setTicketToken(token);
    fetch(`/api/backend/support/ticket/${ticketId}?token=${encodeURIComponent(token)}`)
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => setTicket(payload?.ticket || null))
      .catch(() => null);
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          orderNumber: form.get("orderNumber"),
          subject: form.get("subject"),
          message: form.get("message")
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (response.ok && payload.ticket) {
        const ticketUrl = `/support?ticket=${payload.ticket.id}&token=${payload.ticket.accessToken}`;
        window.history.replaceState(null, "", ticketUrl);
        setTicketToken(payload.ticket.accessToken);
        setTicket({ _id: payload.ticket.id, status: payload.ticket.status, subject: form.get("subject"), thread: [{ author: "customer", body: form.get("message"), createdAt: new Date().toISOString() }] });
      }
      setMessage(response.ok ? "Support ticket sent. Keep this page to follow replies." : payload.message || payload.error || "Could not send ticket.");
    });
  }

  function reply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ticket?._id || !ticketToken) return;
    const formElement = event.currentTarget;
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      const response = await fetch(`/api/backend/support/ticket/${ticket._id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: ticketToken, message: form.get("reply") })
      });
      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        setTicket(payload.ticket);
        formElement.reset();
        setMessage("Reply sent.");
      } else {
        setMessage(payload.error || "Could not send reply.");
      }
    });
  }

  return (
    <div className="support-shell">
      {ticket && (
        <section className="support-thread">
          <p>{ticket.status || "open"}</p>
          <h2>{ticket.subject || "Support ticket"}</h2>
          <div>
            {(ticket.thread || []).map((item: any, index: number) => (
              <article className={item.author === "admin" ? "admin" : ""} key={`${item.createdAt}-${index}`}>
                <span>{item.author === "admin" ? "Werd Support" : "You"}</span>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
          <form onSubmit={reply}>
            <textarea name="reply" placeholder="Reply to support..." rows={4} required />
            <button type="submit" disabled={isPending}>{isPending ? "Sending..." : "Send Reply"}</button>
          </form>
        </section>
      )}
      <form className="glass-form" onSubmit={submit}>
        <h2>Send a message</h2>
        <div className="form-grid">
          <input name="name" placeholder="Name" autoComplete="name" required />
          <input name="email" placeholder="Email" type="email" autoComplete="email" required />
        </div>
        <div className="form-grid">
          <input name="phone" placeholder="Phone" autoComplete="tel" />
          <input name="orderNumber" placeholder="Order number" />
        </div>
        <input name="subject" placeholder="Subject" required />
        <textarea name="message" placeholder="How can we help?" rows={5} required />
        <button type="submit" disabled={isPending}>{isPending ? "Sending..." : "Submit Ticket"}</button>
        {message && <p>{message}</p>}
      </form>
    </div>
  );
}
