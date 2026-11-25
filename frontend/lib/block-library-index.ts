// The Block library index (/block-library): every Relume block this site
// has, by category, with the inventory's filters and a Category filter. Each
// card links to the block's own page (/block-library/heroes/header-1) when
// that page exists.
//
// In production the blocks come from relume/catalogue.json, kept to the
// block types this site registers. The JSON is imported, so it is bundled
// at build time and nothing is read from disk per request. Under `next dev`
// the page lists the shelf instead (lib/relume-shelf.ts), with Add and
// Remove.
//
// Category names and page slugs come from shared/block-library-names.mjs,
// the module the Studio seed writes the block pages with, so a card's link
// and its page's slug cannot drift apart.
import catalogue from "../../relume/catalogue.json";
import {
  blockLibraryBlockSlug,
  blockLibraryCategorySlug,
  categoryName,
} from "../../shared/block-library-names.mjs";
import { BLOCK_LIBRARY_PATH } from "@/lib/block-library";
import {
  classifyTag,
  filterComponents,
  filterHref,
  parseFilters,
  toggleValue,
  type Filters,
} from "@/lib/relume-inventory";
import { asFilterRecord, type ShelfBlock } from "@/lib/relume-shelf";

type SearchParams = Record<string, string | string[] | undefined>;

type CatalogueEntry = Pick<
  ShelfBlock,
  "slug" | "name" | "category" | "tags" | "preview" | "uncommon" | "layoutStyle"
>;

export type LibraryCategory = { slug: string; label: string };

export type LibraryBlock = ShelfBlock & {
  categorySlug: string;
  categoryLabel: string;
  /** The block's Light page, or null when that page does not exist. */
  href: string | null;
};

export type BlockLibraryFilters = Filters & { category: string | null };

/** A block's `_type`: Layout 16 (`layout16`) is `relumeLayout16`. */
export function relumeBlockType(slug: string) {
  return `relume${slug.charAt(0).toUpperCase()}${slug.slice(1)}`;
}

/** The catalogue's entries for the blocks this site registers. */
export function siteBlocks(
  isRegistered: (type: string) => boolean,
  entries: CatalogueEntry[] = catalogue as CatalogueEntry[],
): ShelfBlock[] {
  return entries.flatMap((entry) => {
    const type = relumeBlockType(entry.slug);
    if (!isRegistered(type)) return [];
    return [
      {
        slug: entry.slug,
        type,
        name: entry.name,
        category: entry.category,
        tags: entry.tags ?? [],
        preview: entry.preview ?? "",
        uncommon: Boolean(entry.uncommon),
        layoutStyle: entry.layoutStyle ?? [],
        inSite: true,
      },
    ];
  });
}

/** The slug of a block's Light page, as the Studio seed writes it. */
export function blockPageSlug(block: Pick<ShelfBlock, "category" | "name" | "slug">) {
  return blockLibraryBlockSlug(block.category, block.name || block.slug);
}

/**
 * Each block with its editor-facing category and the link to its page,
 * given the slugs of the pages that exist. Sorted by name within a category
 * ("Header 5" before "Header 19").
 */
export function libraryBlocks(
  blocks: ShelfBlock[],
  pageSlugs: ReadonlySet<string>,
): LibraryBlock[] {
  return blocks
    .map((block) => {
      const slug = blockPageSlug(block);
      return {
        ...block,
        categorySlug: blockLibraryCategorySlug(block.category),
        categoryLabel: categoryName(block.category),
        href: pageSlugs.has(slug) ? `/${slug}` : null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
}

/** The categories the blocks fall in, by name, each once. */
export function libraryCategories(blocks: LibraryBlock[]): LibraryCategory[] {
  const bySlug = new Map<string, string>();
  for (const block of blocks) bySlug.set(block.categorySlug, block.categoryLabel);
  return [...bySlug]
    .map(([slug, label]) => ({ slug, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function firstValue(value: SearchParams[string]) {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * The index's search params: the inventory's Layout, Element and More
 * filters, and `category`, kept only when it names one of `categories`.
 */
export function parseBlockLibraryFilters(
  searchParams: SearchParams,
  categories: LibraryCategory[],
): BlockLibraryFilters {
  const category = firstValue(searchParams.category)?.trim();
  return {
    ...parseFilters(searchParams),
    // The inventory's Status and Decision filters do not apply here.
    status: null,
    decision: null,
    category: categories.some((entry) => entry.slug === category) ? category! : null,
  };
}

/** The blocks in the chosen category, before the other filters. */
export function inCategory(blocks: LibraryBlock[], category: string | null) {
  return category ? blocks.filter((block) => block.categorySlug === category) : blocks;
}

/** The blocks that pass every filter. */
export function filterLibraryBlocks(blocks: LibraryBlock[], filters: BlockLibraryFilters) {
  const candidates = inCategory(blocks, filters.category);
  const shown = new Set(
    filterComponents(candidates.map(asFilterRecord), filters).map((record) => record.slug),
  );
  return candidates.filter((block) => shown.has(block.slug));
}

/** An index URL; `category` comes first, an empty value drops its key. */
export function blockLibraryHref(
  filters: BlockLibraryFilters,
  change: Partial<BlockLibraryFilters> = {},
) {
  const next = { ...filters, ...change };
  const query = filterHref("", next).replace(/^\?/, "");
  const params = new URLSearchParams(next.category ? { category: next.category } : {});
  for (const [key, value] of new URLSearchParams(query)) params.append(key, value);
  const search = params.toString();
  return search ? `${BLOCK_LIBRARY_PATH}?${search}` : BLOCK_LIBRARY_PATH;
}

/** The index URL that toggles one tag from a card, in its own list. */
export function blockLibraryTagHref(filters: BlockLibraryFilters, tag: string) {
  const kind = classifyTag(tag).kind;
  if (kind === "layout") return blockLibraryHref(filters, { layout: toggleValue(filters.layout, tag) });
  if (kind === "element") return blockLibraryHref(filters, { element: toggleValue(filters.element, tag) });
  return null;
}
