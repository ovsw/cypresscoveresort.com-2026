// Where an item of a block imported from Relume links: one `link` field,
// the Starter's shared `button` object, in place of Relume's `url` string
// and the item's one button (see "Item links" in
// docs/agents/relume-import.md), as the hand-finished event9 models it.
import { type BlockButtonRole } from "@/components/blocks/relume/block-buttons";
import { Button } from "@/components/ui/button";
import { getSafeLinkHref } from "@/lib/safe-href";
import { cn } from "@/lib/utils";
import { stegaClean } from "next-sanity";
import Link from "next/link";
import type { ReactNode } from "react";

export type BlockLinkValue = {
  href?: string | null;
  openInNewTab?: boolean | null;
  text?: string | null;
};

function linkProps(link?: BlockLinkValue | null) {
  const href = getSafeLinkHref(link?.href);
  if (!href) return undefined;
  const newTab = Boolean(stegaClean(link?.openInNewTab));
  return {
    href,
    rel: newTab ? "noopener noreferrer" : undefined,
    target: newTab ? "_blank" : undefined,
  };
}

type BlockLinkProps = {
  link?: BlockLinkValue | null;
  className?: string;
  children: ReactNode;
  /**
   * The link repeats one the item draws as text (a photo beside its title
   * and button): it is left out of the tab order and of what a screen
   * reader lists.
   */
  decorative?: boolean;
};

/**
 * An element Relume wraps in `<a href={item.url}>` (a photo, a title). Studio
 * requires the link; without a safe destination the content is drawn
 * unlinked.
 */
export function BlockLink({
  link,
  className,
  children,
  decorative = false,
}: BlockLinkProps) {
  const props = linkProps(link);
  if (!props) return <div className={className}>{children}</div>;
  return (
    <Link
      {...props}
      aria-hidden={decorative || undefined}
      className={className}
      tabIndex={decorative ? -1 : undefined}
    >
      {children}
    </Link>
  );
}

type BlockLinkButtonProps = {
  link?: BlockLinkValue | null;
  className?: string;
  dataSanity?: string;
  /** The style Relume gave the item's button. */
  role: BlockButtonRole;
};

/**
 * The item's one button: its link's label, drawn in the role Relume gave
 * the button, as BlockButtons draws a button. A link without a label or a
 * safe destination is not drawn.
 */
export function BlockLinkButton({
  link,
  className,
  dataSanity,
  role,
}: BlockLinkButtonProps) {
  const props = linkProps(link);
  const label = stegaClean(link?.text)?.trim();
  if (!props || !label) return null;
  return (
    <div className={className}>
      <Button
        asChild
        // A link-style button has no side padding, as in BlockButtons.
        className={cn(role.variant === "link" && "px-0", role.className)}
        variant={role.variant}
      >
        <Link {...props} data-sanity={dataSanity}>
          {link?.text}
          {role.iconRight}
        </Link>
      </Button>
    </div>
  );
}
