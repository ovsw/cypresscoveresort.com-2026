import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SiteFooter } from "./site-footer";
import type { FooterModel } from "./model";

vi.mock("@/app/actions/subscribe-to-newsletter", () => ({
  subscribeToNewsletter: vi.fn(async () => ({ status: "idle" })),
}));

const link = (
  key: string,
  label: string,
  href: string,
  openInNewTab = false,
) => ({ key, label, href, openInNewTab });

const model: FooterModel = {
  brand: { label: "Northline", image: null },
  newsletter: {
    heading: "The weekly bulletin",
    text: "One email a week.",
    inputPlaceholder: "Your email address",
    buttonLabel: "Subscribe",
    successMessage: "You are on the list.",
    errorMessage: "That did not send.",
  },
  columns: [
    {
      key: "company",
      heading: "Company",
      links: [link("about", "About", "/about")],
    },
  ],
  contact: {
    email: link(
      "contact-email",
      "hello@example.com",
      "mailto:hello@example.com",
    ),
    phone: link("contact-phone", "+1 555 0100", "tel:+15550100"),
    addressLines: ["10 Main Street", "Example City"],
  },
  socialLinks: [
    link(
      "linkedin",
      "LinkedIn",
      "https://linkedin.com/company/example",
      true,
    ),
  ],
  legalLinks: [link("privacy", "Privacy", "/privacy")],
  copyrightYears: "2024-2026",
  copyrightOwner: "Northline Studio",
};

describe("SiteFooter", () => {
  it("renders on the Dark scene with the newsletter signup", () => {
    render(<SiteFooter model={model} />);
    const footer = screen.getByRole("contentinfo");

    expect(footer).toHaveClass("block-scene-dark");
    expect(
      within(footer).getByRole("heading", { name: "The weekly bulletin" }),
    ).toBeInTheDocument();
    expect(within(footer).getByLabelText("Email address")).toHaveAttribute(
      "placeholder",
      "Your email address",
    );
    expect(
      within(footer).getByRole("button", { name: "Subscribe" }),
    ).toBeInTheDocument();
  });

  it("hides the newsletter row without a heading", () => {
    render(<SiteFooter model={{ ...model, newsletter: null }} />);
    expect(screen.queryByRole("button", { name: "Subscribe" })).toBeNull();
  });

  it("renders authored identity, navigation, contact, and social links", () => {
    render(<SiteFooter model={model} />);
    const footer = screen.getByRole("contentinfo");

    expect(
      within(footer).getByRole("link", { name: "Northline home page" }),
    ).toHaveAttribute("href", "/");
    expect(
      within(footer).getByRole("heading", { name: "Company" }),
    ).toBeInTheDocument();
    expect(within(footer).getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/about",
    );
    expect(
      within(footer).getByRole("link", { name: /LinkedIn/ }),
    ).toHaveAttribute("target", "_blank");
    expect(within(footer).getByText("10 Main Street")).toBeInTheDocument();
    expect(document.querySelector('a[href="#"]')).not.toBeInTheDocument();
  });

  it("maps editable footer copy to its Sanity paths", () => {
    const dataAttribute = (path: string) => `field:${path}`;
    render(<SiteFooter dataAttribute={dataAttribute} model={model} />);

    expect(
      document.querySelector('[data-sanity="field:newsletter.heading"]'),
    ).toHaveTextContent("The weekly bulletin");
    expect(
      document.querySelector(
        '[data-sanity="field:copyrightStartYear"]',
      ),
    ).toHaveTextContent("2024-2026");
    expect(
      document.querySelector('[data-sanity="field:copyrightOwner"]'),
    ).toHaveTextContent("Northline Studio");
  });
});
