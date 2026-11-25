// Relume Footer 5: newsletter row, logo with link columns, then copyright,
// legal links and social icons. The footer always uses the Dark block theme.
import Image from "next/image";
import Link from "next/link";
import { FooterLink } from "./footer-link";
import { FooterIcon, socialIconFor } from "./icons";
import type { FooterColumnModel, FooterLinkModel, FooterModel } from "./model";
import { NewsletterForm } from "./newsletter-form";

function LinkList({ links }: { links: FooterLinkModel[] }) {
  return (
    <ul>
      {links.map((link) => (
        <li className="py-2 text-sm" key={link.key}>
          <FooterLink link={link} />
        </li>
      ))}
    </ul>
  );
}

function FooterColumn({ column }: { column: FooterColumnModel }) {
  const headingId = `footer-column-${column.key}`;
  return (
    <section aria-labelledby={headingId} className="flex flex-col items-start">
      <h2 className="mb-3 font-semibold md:mb-4" id={headingId}>
        {column.heading}
      </h2>
      <LinkList links={column.links} />
    </section>
  );
}

function SocialLink({ link }: { link: FooterLinkModel }) {
  const icon = socialIconFor(link.href);
  return (
    <FooterLink link={link}>
      {icon ? (
        <>
          <FooterIcon className="size-6" name={icon} />
          <span className="sr-only">{link.label}</span>
        </>
      ) : (
        <span className="text-sm">{link.label}</span>
      )}
    </FooterLink>
  );
}

export function SiteFooter({
  dataAttribute,
  model,
}: {
  dataAttribute?: (path: string) => string | undefined;
  model: FooterModel;
}) {
  const { contact, newsletter } = model;
  const hasContact = Boolean(
    contact.email || contact.phone || contact.addressLines.length,
  );

  return (
    <footer
      className="block-scene-dark bg-background py-12 text-foreground md:py-18 lg:py-20"
      data-footer-state="ready"
    >
      <div className="container">
        {newsletter ? (
          <div
            className="mb-12 block items-start justify-between gap-8 md:mb-18 lg:mb-20 lg:flex"
            data-sanity={dataAttribute?.("newsletter")}
          >
            <div className="mb-6 lg:mb-0">
              <h2
                className="text-lg font-semibold"
                data-sanity={dataAttribute?.("newsletter.heading")}
              >
                {newsletter.heading}
              </h2>
              {newsletter.text ? (
                <p
                  className="text-soft-foreground"
                  data-sanity={dataAttribute?.("newsletter.text")}
                >
                  {newsletter.text}
                </p>
              ) : null}
            </div>
            <div className="max-w-md lg:min-w-[25rem]">
              <NewsletterForm
                fieldTargets={{
                  inputPlaceholder: dataAttribute?.("newsletter.inputPlaceholder"),
                  buttonLabel: dataAttribute?.("newsletter.buttonLabel"),
                  successMessage: dataAttribute?.("newsletter.successMessage"),
                  errorMessage: dataAttribute?.("newsletter.errorMessage"),
                }}
                newsletter={newsletter}
              />
            </div>
          </div>
        ) : null}

        <div className="mb-12 grid grid-cols-1 items-start gap-x-8 gap-y-10 sm:grid-cols-3 md:mb-18 md:gap-y-12 lg:mb-20 lg:grid-cols-6">
          <Link
            aria-label={`${model.brand.label} home page`}
            className="text-lg font-semibold sm:col-span-3 lg:col-span-1"
            href="/"
          >
            {model.brand.image ? (
              <Image
                alt={model.brand.label}
                className="h-9 w-auto"
                height={model.brand.image.height}
                src={model.brand.image.src}
                width={model.brand.image.width}
              />
            ) : (
              model.brand.label
            )}
          </Link>
          {model.columns.map((column) => (
            <FooterColumn column={column} key={column.key} />
          ))}
          {hasContact ? (
            <section
              aria-labelledby="footer-contact"
              className="flex flex-col items-start"
            >
              <h2 className="mb-3 font-semibold md:mb-4" id="footer-contact">
                Contact
              </h2>
              <ul>
                {contact.addressLines.length ? (
                  <li className="py-2 text-sm">
                    <address className="not-italic">
                      {contact.addressLines.map((line) => (
                        <div key={line}>{line}</div>
                      ))}
                    </address>
                  </li>
                ) : null}
                {contact.phone ? (
                  <li className="py-2 text-sm">
                    <FooterLink link={contact.phone} />
                  </li>
                ) : null}
                {contact.email ? (
                  <li className="py-2 text-sm break-all">
                    <FooterLink link={contact.email} />
                  </li>
                ) : null}
              </ul>
            </section>
          ) : null}
        </div>

        <div className="h-px w-full bg-border" />

        <div className="flex flex-col-reverse items-start pt-6 pb-4 text-sm md:pt-8 md:pb-0 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col-reverse items-start md:flex-row md:gap-6 lg:items-center">
            <p className="mt-8 md:mt-0">
              ©{" "}
              <span data-sanity={dataAttribute?.("copyrightStartYear")}>
                {model.copyrightYears}
              </span>{" "}
              <span data-sanity={dataAttribute?.("copyrightOwner")}>
                {model.copyrightOwner}
              </span>
            </p>
            {model.legalLinks.length ? (
              <nav aria-label="Legal links">
                <ul className="grid grid-flow-row grid-cols-[max-content] gap-y-4 md:grid-flow-col md:gap-x-6 md:gap-y-0">
                  {model.legalLinks.map((link) => (
                    <li className="underline" key={link.key}>
                      <FooterLink link={link} />
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
          </div>
          {model.socialLinks.length ? (
            <nav aria-label="Social links">
              <ul className="mb-8 flex items-center gap-3 lg:mb-0">
                {model.socialLinks.map((link) => (
                  <li key={link.key}>
                    <SocialLink link={link} />
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
