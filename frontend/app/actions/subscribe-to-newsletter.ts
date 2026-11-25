"use server";

export type NewsletterSignupState = { status: "idle" | "success" | "error" };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Sends a footer newsletter signup to the email provider. The provider is not
// chosen yet, so the address goes as JSON to NEWSLETTER_SIGNUP_WEBHOOK_URL,
// which most providers and automation tools accept. Without that variable
// every signup fails, and the footer shows the editor's error message, which
// offers another way to subscribe.
export async function subscribeToNewsletter(
  _previous: NewsletterSignupState,
  formData: FormData,
): Promise<NewsletterSignupState> {
  const email = String(formData.get("email") ?? "").trim();
  const webhook = process.env.NEWSLETTER_SIGNUP_WEBHOOK_URL;
  if (!EMAIL.test(email) || !webhook) return { status: "error" };

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source: "website-footer" }),
      signal: AbortSignal.timeout(10_000),
    });
    return { status: response.ok ? "success" : "error" };
  } catch {
    return { status: "error" };
  }
}
