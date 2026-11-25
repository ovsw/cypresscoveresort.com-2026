import { Button } from "@/components/ui/button";
import { getSafeLinkHref } from "@/lib/safe-href";
import { cn } from "@/lib/utils";
import { stegaClean } from "next-sanity";
import Link from "next/link";
import type { ReactNode } from "react";

type BlockButton = {
  _key?: string | null;
  href?: string | null;
  openInNewTab?: boolean | null;
  text?: string | null;
};

export type BlockButtonRole = {
  variant: "primary" | "outline" | "ghost" | "link";
  /** Decorative icon drawn after the label, as the Relume original has it. */
  iconRight?: ReactNode;
  /** Classes the Relume original sets on this button itself (`w-full`). */
  className?: string;
};

type BlockButtonsProps = {
  buttons?: BlockButton[] | null;
  className?: string;
  dataAttribute?: (path: string) => string | undefined;
  /** Path of the buttons array inside the block. Default: `buttons`. */
  path?: string;
  /** One role per position. A button past the last role is not drawn. */
  roles: BlockButtonRole[];
};

/**
 * The buttons of a block imported from Relume. An editor never picks a
 * button style: the role comes from the button's position, as the Relume
 * original set it. A button without visible text or a safe destination is
 * not drawn, and the wrapper is not drawn without buttons.
 */
export function BlockButtons({
  buttons,
  className,
  dataAttribute,
  path = "buttons",
  roles,
}: BlockButtonsProps) {
  // The role is read from the button's own position before an unusable
  // button is dropped, so the second button never takes the first's style.
  const links = (buttons ?? [])
    .slice(0, roles.length)
    .flatMap((button, index) => {
      const href = getSafeLinkHref(button.href);
      const label = stegaClean(button.text)?.trim();
      if (!href || !label) return [];
      return [
        {
          ...button,
          href,
          key: button._key || `${href}-${index}`,
          role: roles[index],
        },
      ];
    });

  if (!links.length || !roles.length) return null;

  // A row of buttons wraps instead of running off a narrow screen: a
  // button keeps its label on one line. The row gap (1rem, Relume's usual
  // `gap-4`) shows only once the row wraps, and a gap the block sets wins.
  const row =
    className &&
    /(^|\s)flex(\s|$)/.test(className) &&
    !/(^|\s)flex-col(\s|$)/.test(className);

  return (
    <div
      className={row ? cn("flex-wrap gap-y-4", className) : className}
      data-sanity={dataAttribute?.(path)}
    >
      {links.map((button) => {
        const { role } = button;
        const newTab = Boolean(stegaClean(button.openInNewTab));
        return (
          <Button
            asChild
            // A link-style button has no side padding, as Relume's `link`
            // size, so its label lines up with the text above it; it keeps
            // the button height as its tap target.
            className={cn(role.variant === "link" && "px-0", role.className)}
            key={button.key}
            variant={role.variant}
          >
            <Link
              data-sanity={dataAttribute?.(`${path}[_key=="${button._key}"]`)}
              href={button.href}
              rel={newTab ? "noopener noreferrer" : undefined}
              target={newTab ? "_blank" : undefined}
            >
              {button.text}
              {role.iconRight}
            </Link>
          </Button>
        );
      })}
    </div>
  );
}
