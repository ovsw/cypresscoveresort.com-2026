// The Block library's block pages follow the shelf: every shelf block has a
// Light and a Dark page of its own, at a slug under its category, holding
// only that block. The index that lists them is a Website route; the index
// and category pages an earlier seed wrote are listed as retired.
//
// A Website has no relume/shelf.json (its first setup deletes it), so the
// tests that compare against the shelf run only in the Starter.
import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { categoryName } from "../../shared/block-library-names.mjs";
import {
  BLOCK_LIBRARY_ID_PREFIX,
  RETIRED_BLOCK_LIBRARY_INDEX_ID,
  blockLibraryCategories,
  blockLibraryPages,
  readBlockEntries,
} from "./block-library.mjs";
import { relumeSampleBlocks } from "./seed-relume-blocks.mjs";

const shelfFile = new URL("../../relume/shelf.json", import.meta.url);
const starterOnly = {
  skip: !existsSync(shelfFile) && "no relume/shelf.json: this is a Website, not the Starter",
};
const readShelfBlocks = () => JSON.parse(readFileSync(shelfFile, "utf8")).sections;

const helpers = {
  button: (key, text) => ({ _key: key, _type: "button", text }),
  image: (name) => ({ _type: "image", name }),
};
// Built on first use, so a failure is one test's, not the whole file's.
let built;
const pages = () => (built ??= blockLibraryPages(helpers));
let grouped;
const categories = () =>
  (grouped ??= blockLibraryCategories(relumeSampleBlocks(helpers)));
const lightPages = () =>
  pages().blockPages.filter((page) => !page._id.endsWith("-dark"));
const entries = (pairs) =>
  new Map(pairs.map(([slug, category]) => [slug, { category }]));

test("every shelf block has exactly one Light page", starterOnly, () => {
  const shelf = readShelfBlocks();
  const placed = lightPages().map((page) => page.blocks[0]._type);
  assert.deepEqual(
    shelf.map((block) => block.type).filter((type) => !placed.includes(type)),
    [],
    "These shelf blocks have no Block library page; add their seed block to seed-relume-blocks.mjs.",
  );
  assert.equal(new Set(placed).size, placed.length, "A block has two pages.");
});

test("a block's page sits under its shelf category", starterOnly, () => {
  const shelf = readShelfBlocks();
  for (const page of lightPages()) {
    const block = shelf.find((entry) => `relume-${entry.slug}` === page.blocks[0]._key);
    assert.equal(page._id, `${BLOCK_LIBRARY_ID_PREFIX}${block.category}-${block.slug}`);
    assert.equal(page.title, block.name);
    assert.ok(page.slug.startsWith(`block-library/`), page.slug);
  }
});

test("every block has a Light and a Dark page that holds only it", () => {
  const { blockPages } = pages();
  const light = lightPages();
  assert.equal(blockPages.length, light.length * 2);
  for (const page of light) {
    const dark = blockPages.find((blockPage) => blockPage._id === `${page._id}-dark`);
    assert.ok(dark, `No Dark page for ${page.title}`);
    assert.match(page.slug, /^block-library\/[a-z0-9]+(-[a-z0-9]+)*\/[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.equal(dark.slug, `${page.slug}/dark`);
    assert.equal(dark.title, `${page.title} (Dark)`);
    for (const [blockPage, theme] of [[page, "light"], [dark, "dark"]]) {
      assert.equal(blockPage.blocks.length, 1, `${blockPage._id} holds one block`);
      assert.equal(blockPage.blocks[0].theme, theme);
      assert.ok(blockPage._id.startsWith(BLOCK_LIBRARY_ID_PREFIX));
    }
    assert.equal(page.blocks[0]._key, dark.blocks[0]._key);
  }
  assert.equal(
    new Set(blockPages.map((page) => page.slug)).size,
    blockPages.length,
    "Two block pages share a slug.",
  );
});

test("the retired pages are the index and one category page per category", () => {
  const { blockPages, retiredPageIds } = pages();
  assert.deepEqual(retiredPageIds, [
    RETIRED_BLOCK_LIBRARY_INDEX_ID,
    ...categories().map((category) => `${BLOCK_LIBRARY_ID_PREFIX}${category.category}`),
  ]);
  const blockPageIds = new Set(blockPages.map((page) => page._id));
  for (const id of retiredPageIds) assert.equal(blockPageIds.has(id), false, id);
});

test("the Starter's categories have plain names", starterOnly, () => {
  const names = categories().map((category) => category.name);
  for (const name of ["Heroes", "Features", "Calls to action"]) {
    assert.ok(names.includes(name), name);
  }
});

test("a block in a new category makes a new category", () => {
  const blocks = [
    { _key: "relume-header1", _type: "relumeHeader1" },
    { _key: "relume-banner1", _type: "relumeBanner1" },
  ];
  const categories = entries([
    ["header1", "hero-header-sections"],
    ["banner1", "banners"],
  ]);
  const grouped = blockLibraryCategories(blocks, categories);
  assert.deepEqual(
    grouped.map((category) => [category.name, category.blocks[0].lightSlug]),
    [
      ["Banners", "block-library/banners/banner1"],
      ["Heroes", "block-library/heroes/header1"],
    ],
  );
  assert.equal(categoryName("blog-header-sections"), "Blog headers");
  assert.equal(categoryName("multi-step-forms"), "Multi step forms");
});

test("a sample block with no known category is refused", () => {
  assert.throws(
    () =>
      blockLibraryCategories(
        [{ _key: "relume-unknown9", _type: "relumeUnknown9" }],
        new Map(),
      ),
    /no category for relumeUnknown9/,
  );
});

test("without relume/shelf.json the categories come from relume/catalogue.json", (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "block-library-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(path.join(root, "relume"));
  writeFileSync(
    path.join(root, "relume", "catalogue.json"),
    JSON.stringify([
      { slug: "header1", category: "hero-header-sections", name: "Header 1" },
      {
        slug: "faq1",
        category: "faq-sections",
        name: "FAQ 1",
        preview: "https://example.com/faq1.png",
      },
    ]),
  );
  const [category] = blockLibraryCategories(
    [{ _key: "relume-faq1", _type: "relumeFaq1" }],
    readBlockEntries(root),
  );
  assert.deepEqual([category.name, category.blocks.length], ["FAQs", 1]);
  assert.deepEqual(
    [category.blocks[0].name, category.blocks[0].lightSlug, category.blocks[0].darkSlug],
    ["FAQ 1", "block-library/faqs/faq-1", "block-library/faqs/faq-1/dark"],
  );
});
