import { isRouteSlug } from "@/lib/routes";

export type BlockPageParams = { category: string; block: string };

/**
 * The slug of the Sanity page behind a Block library block route:
 * "block-library/heroes/header-1", or with "/dark" for its Dark page. Null
 * when a segment is not a valid slug.
 */
export function blockPageSlug(
  { category, block }: BlockPageParams,
  theme: "dark" | "light",
) {
  if (!isRouteSlug(category) || !isRouteSlug(block)) return null;
  const light = `block-library/${category}/${block}`;
  return theme === "dark" ? `${light}/dark` : light;
}
