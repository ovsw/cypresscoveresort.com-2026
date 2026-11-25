import { FooterIcon, socialIconFor } from "@/components/footer/icons";
import { getSafeLinkHref } from "@/lib/safe-href";
import { cn } from "@/lib/utils";
import { stegaClean } from "next-sanity";

/** A `socialLink` object (label and URL), as the block queries project it. */
type BlockSocialLink = {
  _key?: string | null;
  label?: string | null;
  url?: string | null;
};

type BlockSocialLinksProps = {
  className?: string;
  dataAttribute?: (path: string) => string | undefined;
  links?: BlockSocialLink[] | null;
  /** Path of the links array inside the block. */
  path: string;
};

/**
 * The social links of a block imported from Relume, drawn as icons. As in the
 * Website footer, editors keep plain links: the icon follows the link's
 * hostname (`socialIconFor`), and a site with no icon of its own shows a
 * globe. The label is the link's name for screen readers. A link without a
 * label or a safe URL is not drawn, and the wrapper is not drawn without
 * links.
 */
export function BlockSocialLinks({
  className,
  dataAttribute,
  links,
  path,
}: BlockSocialLinksProps) {
  const usable = (links ?? []).flatMap((link, index) => {
    const href = getSafeLinkHref(link.url);
    const label = stegaClean(link.label)?.trim();
    if (!href || !label) return [];
    return [
      {
        ...link,
        href,
        icon: socialIconFor(href) ?? "globe",
        key: link._key || `${href}-${index}`,
      },
    ];
  });

  if (!usable.length) return null;

  return (
    <div className={className} data-sanity={dataAttribute?.(path)}>
      {usable.map((link) => (
        <a
          data-sanity={dataAttribute?.(`${path}[_key=="${link._key}"]`)}
          href={link.href}
          key={link.key}
          rel="noopener noreferrer"
          target="_blank"
        >
          <FooterIcon
            className={cn(
              "size-6 text-foreground",
              // Relume pads the X glyph so it looks as large as the others.
              link.icon === "x" && "p-0.5",
            )}
            name={link.icon}
          />
          <span className="sr-only">{link.label}</span>
        </a>
      ))}
    </div>
  );
}
