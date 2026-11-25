// The Block library's block pages: each block converted from Relume has a
// page of its own that shows only that block, once on Light
// (/block-library/heroes/header-1) and once on Dark
// (/block-library/heroes/header-1/dark). The index that lists them, with a
// Category filter, is a Website route (frontend/app/block-library/page.tsx),
// not a seeded page.
//
// Everything here is derived from the sample blocks in
// seed-relume-blocks.mjs and what the shelf records for each block
// (relume/shelf.json): its category and name. Adding a block to the shelf
// gives it its two pages. A Website built from the Starter has no shelf.json
// (setup deletes it), so the same details are then read from
// relume/catalogue.json, which records them for every Relume block.
//
// A block page holds the sample block alone, so a hero is the page's first
// block (and draws its <h1>) and a scroll-driven block has the page to
// scroll in. The Website adds the small heading, the link back to the
// Block library filtered to the category and the Light/Dark switch from the
// page's slug (frontend/lib/block-library.ts).
//
// An earlier seed also wrote an index page at /block-library and one
// thumbnail page per category at /block-library/<category>. Their ids are
// listed here (retiredPageIds) so the seed tools delete them from a dataset
// that still has them.
//
// `pnpm seed` (seed.mjs) and the `pnpm page:seed` module
// (block-library-page.seed.mjs) both write these pages.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BLOCK_LIBRARY_DARK_SEGMENT,
  blockLibraryBlockSlug,
  categoryName,
} from "../../shared/block-library-names.mjs";
import { relumeSampleBlocks } from "./seed-relume-blocks.mjs";

const rootDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

/** The retired index page at /block-library, now a Website route. */
export const RETIRED_BLOCK_LIBRARY_INDEX_ID = "starter-page-block-library";
/**
 * Every block page's id starts with this, as did every retired category
 * page's.
 */
export const BLOCK_LIBRARY_ID_PREFIX = `${RETIRED_BLOCK_LIBRARY_INDEX_ID}-`;

/**
 * Relume block slug to the block's category and name: from relume/shelf.json
 * in the Starter, from relume/catalogue.json in a Website (which has no
 * shelf.json).
 *
 * @returns {Map<string, { category: string, name?: string }>}
 */
export function readBlockEntries(root = rootDirectory) {
  const shelfFile = path.join(root, "relume", "shelf.json");
  const entries = existsSync(shelfFile)
    ? JSON.parse(readFileSync(shelfFile, "utf8")).sections
    : JSON.parse(
        readFileSync(path.join(root, "relume", "catalogue.json"), "utf8"),
      );
  return new Map(
    entries.map(({ slug, category, name }) => [slug, { category, name }]),
  );
}

/** A sample block's Relume slug, from its `_key` ("relume-header1"). */
export function sampleBlockSlug(block) {
  return block._key.replace(/^relume-/, "");
}

/**
 * The shelf's blocks grouped by Relume category, most blocks first. Each
 * category has its plain name and the id its retired category page had (the
 * start of its block pages' ids), and its blocks in shelf order: each with
 * its sample, name, and the ids and slugs of its Light and Dark pages.
 */
export function blockLibraryCategories(
  sampleBlocks,
  entries = readBlockEntries(),
) {
  const byCategory = new Map();
  for (const sample of sampleBlocks) {
    const relumeSlug = sampleBlockSlug(sample);
    const entry = entries.get(relumeSlug);
    const category = entry?.category;
    if (!category) {
      throw new Error(
        `The Block library has no category for ${sample._type} (${sample._key}): it is not in relume/shelf.json or relume/catalogue.json.`,
      );
    }
    if (!byCategory.has(category)) byCategory.set(category, []);
    byCategory.get(category).push({ sample, relumeSlug, name: entry.name });
  }
  return [...byCategory]
    .map(([category, blocks]) => {
      const id = `${BLOCK_LIBRARY_ID_PREFIX}${category}`;
      return {
        category,
        name: categoryName(category),
        id,
        blocks: blocks.map(({ sample, relumeSlug, name: blockName }) => {
          const title = blockName || relumeSlug;
          const blockId = `${id}-${relumeSlug}`;
          const blockSlug = blockLibraryBlockSlug(category, title);
          return {
            sample,
            name: title,
            lightId: blockId,
            lightSlug: blockSlug,
            darkId: `${blockId}-${BLOCK_LIBRARY_DARK_SEGMENT}`,
            darkSlug: `${blockSlug}/${BLOCK_LIBRARY_DARK_SEGMENT}`,
          };
        }),
      };
    })
    .sort((a, b) => b.blocks.length - a.blocks.length || a.name.localeCompare(b.name));
}

/**
 * The block pages, as page fields (`_id`, `title`, `description`, `slug` as
 * a string, `blocks`), and the ids of the pages an earlier seed wrote that
 * this one no longer does: the index and one category page per category. The
 * caller adds `_type`, the seed marker and how `slug` is stored.
 *
 * @param {{
 *   button: (key: string, text: string) => object,
 *   image: (name: string) => object,
 *   entries?: Map<string, { category: string, name?: string }>,
 * }} helpers
 */
export function blockLibraryPages({ button, image, entries }) {
  const categories = blockLibraryCategories(
    relumeSampleBlocks({ button, image }),
    entries,
  );
  // Two pages per block, the sample alone on each: one on Light, one on Dark.
  const blockPages = categories.flatMap((category) =>
    category.blocks.flatMap((block) =>
      [
        ["light", block.lightId, block.lightSlug, block.name],
        ["dark", block.darkId, block.darkSlug, `${block.name} (Dark)`],
      ].map(([theme, id, slug, title]) => ({
        _id: id,
        title,
        description: `Relume's ${block.name}, in the ${category.name} category of the Block library, on a ${theme === "light" ? "Light" : "Dark"} theme.`,
        slug,
        blocks: [{ ...block.sample, theme }],
      })),
    ),
  );
  const retiredPageIds = [
    RETIRED_BLOCK_LIBRARY_INDEX_ID,
    ...categories.map((category) => category.id),
  ];
  return { blockPages, retiredPageIds };
}
