import Link from "next/link";
import type { ReactNode } from "react";
import type { BlockLibraryBlockPage } from "@/lib/block-library";
import { cn } from "@/lib/utils";

// The controls on a Block library block page: a link back to the index,
// filtered to the block's category, and the Light/Dark switch. They float at
// the bottom centre of the window, out of the page's flow, so the sample
// block is the only thing drawn on the page. The pill keeps its own colours
// so it reads the same over a Light and a Dark block.
//
// It is not a Page Builder block, so the sample block stays the page's first
// block. When that block is not a hero, nothing else draws the page's <h1>,
// so the block's name is one here, for screen readers only.
export function BlockLibraryBar({
  page,
  title,
  titleIsHeading,
}: {
  page: BlockLibraryBlockPage;
  title: ReactNode;
  titleIsHeading: boolean;
}) {
  const themes = [
    { label: "Light", href: page.lightPath, current: page.theme === "light" },
    { label: "Dark", href: page.darkPath, current: page.theme === "dark" },
  ];
  return (
    <>
      {titleIsHeading ? <h1 className="sr-only">{title}</h1> : null}
      <nav
        aria-label="Block library"
        className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-zinc-200 bg-white p-1 text-sm text-zinc-900 shadow-lg"
        data-block-library-bar=""
      >
        <Link
          aria-label="Back to the Block library"
          className="rounded-full px-3 py-1 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          href={page.indexPath}
        >
          <span aria-hidden="true">←</span> Library
        </Link>
        <span aria-hidden="true" className="h-4 w-px bg-zinc-200" />
        <ul className="flex gap-1" aria-label="Theme">
          {themes.map((theme) => (
            <li key={theme.label}>
              <Link
                aria-current={theme.current ? "page" : undefined}
                className={cn(
                  "block rounded-full px-3 py-1",
                  theme.current
                    ? "bg-zinc-900 text-white"
                    : "hover:bg-zinc-100",
                )}
                href={theme.href}
                scroll={false}
              >
                {theme.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
