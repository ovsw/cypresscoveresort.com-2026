// A Block library block page: one sample block alone, on Light at
// /block-library/<category>/<block> or on Dark at .../<block>/dark. The
// Studio seed writes these pages (studio/scripts/block-library.mjs) with
// nothing on them but the block, so a hero is the page's first block. The
// Website adds their small heading, the link back to the index filtered to
// the block's category and the Light/Dark switch from the slug alone.
import { BLOCK_LIBRARY_SLUG } from "../../shared/block-library-names.mjs";

// Every seeded Block library page's id starts with this; a page an editor
// made at a similar slug is a normal page.
const BLOCK_LIBRARY_ID_PREFIX = "starter-page-block-library-";
const SLUG_SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The Block library index, a code route (app/block-library/page.tsx). */
export const BLOCK_LIBRARY_PATH = `/${BLOCK_LIBRARY_SLUG}`;

/** The index filtered to one category: /block-library?category=heroes. */
export function blockLibraryCategoryHref(category: string) {
  return `${BLOCK_LIBRARY_PATH}?${new URLSearchParams({ category })}`;
}

export type BlockLibraryBlockPage = {
  /** The index, filtered to the block's category. */
  indexPath: string;
  darkPath: string;
  lightPath: string;
  theme: "dark" | "light";
};

export function blockLibraryBlockPage(page: {
  _id: string;
  slug?: string | null;
}): BlockLibraryBlockPage | null {
  const id = page._id.replace(/^drafts\./, "");
  if (!id.startsWith(BLOCK_LIBRARY_ID_PREFIX)) return null;
  const segments = (page.slug ?? "").split("/").filter(Boolean);
  const [library, category, block, theme, ...rest] = segments;
  if (
    library !== BLOCK_LIBRARY_SLUG ||
    !category ||
    !block ||
    rest.length ||
    (theme !== undefined && theme !== "dark") ||
    ![category, block].every((segment) => SLUG_SEGMENT.test(segment))
  ) {
    return null;
  }
  const lightPath = `${BLOCK_LIBRARY_PATH}/${category}/${block}`;
  return {
    indexPath: blockLibraryCategoryHref(category),
    darkPath: `${lightPath}/dark`,
    lightPath,
    theme: theme === "dark" ? "dark" : "light",
  };
}
