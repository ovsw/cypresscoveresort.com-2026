// A `pnpm page:seed` module that writes the Block library's block pages as
// drafts: a Light and a Dark page for every block, each with the Starter's
// placeholder images. The index that lists them (/block-library, with a
// Category filter) is a Website route, not a page.
// Use it to look at the blocks in a dataset that the Starter seed has
// already filled (`pnpm seed` writes the same pages). See block-library.mjs
// for how the pages follow the shelf.
//
// The same transaction deletes, with their drafts, the pages an earlier seed
// wrote that this one no longer does: the Block library's index page
// (starter-page-block-library), its category pages
// (starter-page-block-library-<category>) and the "Section library" page
// before them (starter-page-section-library). Deleting an id that is not in
// the dataset does nothing.
//
//   pnpm page:seed studio/scripts/block-library-page.seed.mjs           # dry run
//   pnpm page:seed studio/scripts/block-library-page.seed.mjs --apply   # write the drafts
//
// It needs at least one sample block, so it is for the Starter: a Website
// drops the sample blocks at setup and has no block pages to write.
//
// The dataset must hold the Starter's placeholder images and a published
// homePage, which every sample button links to. Block pages hold no
// references to each other; the Website draws their links from the slug.
import { blockLibraryPages } from "./block-library.mjs";
import {
  RETIRED_STARTER_PAGE_IDS,
  STARTER_ASSETS,
  STARTER_SEED,
} from "./seed.mjs";

const image = (name) => ({
  _type: "image",
  alt: "Neutral placeholder image.",
  asset: {
    _type: "reference",
    _ref: STARTER_ASSETS.find((asset) => asset.name === name).id,
  },
});
const button = (key, text) => ({
  _key: key,
  _type: "button",
  text,
  url: {
    _type: "customUrl",
    type: "internal",
    internal: { _type: "reference", _ref: "homePage" },
    openInNewTab: false,
  },
});

// The Starter's ownership marker, so `pnpm unseed` can remove the pages.
const [first, ...rest] = blockLibraryPages({ button, image }).blockPages.map(
  (page) => ({ ...page, _starterSeed: STARTER_SEED }),
);

if (!first) {
  throw new Error(
    "This site has no Relume sample blocks, so there are no Block library block pages to write.",
  );
}

export default {
  // page:seed writes one page and its supporting documents; the first block
  // page is the page, the rest are written beside it.
  page: first,
  documents: rest.map(({ slug, ...page }) => ({
    ...page,
    _type: "page",
    slug: { _type: "slug", current: slug },
  })),
  remove: RETIRED_STARTER_PAGE_IDS,
};
