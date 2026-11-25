"use client";

import { useActionState } from "react";
import {
  subscribeToNewsletter,
  type NewsletterSignupState,
} from "@/app/actions/subscribe-to-newsletter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FooterNewsletterModel } from "./model";

const initialState: NewsletterSignupState = { status: "idle" };

// Studio Presentation targets for the form's copy. The server works them out,
// since a function cannot cross into a client component.
export type NewsletterFieldTargets = Partial<
  Record<
    "inputPlaceholder" | "buttonLabel" | "successMessage" | "errorMessage",
    string
  >
>;

export function NewsletterForm({
  fieldTargets = {},
  newsletter,
}: {
  fieldTargets?: NewsletterFieldTargets;
  newsletter: FooterNewsletterModel;
}) {
  const [state, action, pending] = useActionState(
    subscribeToNewsletter,
    initialState,
  );

  if (state.status === "success") {
    return (
      <p
        className="text-sm"
        data-sanity={fieldTargets.successMessage}
        role="status"
      >
        {newsletter.successMessage}
      </p>
    );
  }

  return (
    <>
      <form
        action={action}
        className="mb-3 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-[1fr_max-content] sm:gap-y-4 md:gap-4"
      >
        <label className="sr-only" htmlFor="footer-newsletter-email">
          Email address
        </label>
        <Input
          autoComplete="email"
          aria-describedby={
            state.status === "error" ? "footer-newsletter-error" : undefined
          }
          data-sanity={fieldTargets.inputPlaceholder}
          id="footer-newsletter-email"
          name="email"
          placeholder={newsletter.inputPlaceholder ?? undefined}
          required
          type="email"
        />
        <Button
          className="h-auto min-h-(--control-height) px-6 text-base"
          data-sanity={fieldTargets.buttonLabel}
          disabled={pending}
          type="submit"
          variant="outline"
        >
          {newsletter.buttonLabel}
        </Button>
      </form>
      {state.status === "error" ? (
        <p
          className="text-xs"
          data-sanity={fieldTargets.errorMessage}
          id="footer-newsletter-error"
          role="alert"
        >
          {newsletter.errorMessage}
        </p>
      ) : null}
    </>
  );
}
