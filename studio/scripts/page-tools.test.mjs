import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { main, withKeys } from "./seed-page-draft.mjs";
import { BLOCK_LIBRARY_BLOCK_PAGE_IDS as LIBRARY_PAGE_IDS } from "./seed.mjs";
import { matchedPageId, normalizeSlug, selectPage, blockText } from "./lib/page-text.mjs";

test("text selection prefers drafts and supports published-only reads", () => {
  const published = { _id: "page", title: "Live" };
  const draft = { _id: "drafts.page", title: "Work in progress" };
  assert.equal(selectPage([published, draft]), draft);
  assert.equal(selectPage([published, draft], true), published);
  assert.equal(selectPage([published]), published);
  assert.equal(selectPage([draft], true), undefined);
});

test("a slug match on either copy of a page resolves to its published id", () => {
  // Published slug "about", draft slug "about-us": each search finds one copy.
  assert.equal(matchedPageId(["page"]), "page");
  assert.equal(matchedPageId(["drafts.page"]), "page");
  assert.equal(matchedPageId(["drafts.other", "page"]), "page");
  assert.equal(matchedPageId(["versions.release.page"]), undefined);
  assert.equal(matchedPageId([]), undefined);
});

test("block text keeps rich text and nested labels", () => {
  assert.equal(blockText({ title: "Intro", body: [{ _type: "block", children: [{ text: "First" }, { text: " second" }] }], buttons: [{ text: "Read more" }] }), "title: Intro\nFirst second\ntext: Read more");
});

test("block text preserves mixed rich-text item order and table cells", () => {
  const paragraph = (text) => ({ _type: "block", children: [{ text }] });
  const block = {
    body: [
      paragraph("Before"),
      { _type: "callout", title: "Note", body: [paragraph("Inside note")] },
      paragraph("Between"),
      {
        _type: "table",
        rows: [
          { _type: "tableRow", cells: ["Name", "Price"] },
          { _type: "tableRow", cells: ["Camp", "$25"] },
        ],
      },
      paragraph("After"),
    ],
  };
  assert.equal(
    blockText(block),
    "Before\ntitle: Note\nInside note\nBetween\nName | Price\nCamp | $25\nAfter",
  );
});

test("table text keeps empty cell positions without printing non-text metadata", () => {
  assert.equal(
    blockText({ rows: [{ cells: ["First", "", "Third"] }], tags: ["internal"], _key: "hidden" }),
    "First |  | Third",
  );
});

test("array keys are stable and existing keys remain", () => {
  const value = [{ _type: "exampleBlock", children: [{ text: "Example" }] }, { _key: "keep" }];
  assert.deepEqual(withKeys(value), withKeys(value));
  assert.equal(withKeys(value)[1]._key, "keep");
  assert.ok(withKeys(value)[0].children[0]._key);
  assert.equal(value[0]._key, undefined);
});

test("seed dry run never starts a transaction; apply only writes drafts with a revision guard", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "page-tools-"));
  const file = path.join(directory, "seed.mjs");
  await writeFile(file, 'export default { page: { _id: "example", blocks: [] }, documents: [{ _id: "example-faq", _type: "faq", question: "Why?" }] };');
  const calls = [];
  const transaction = {
    patch(id, configure) {
      calls.push(["patch", id]);
      const patch = { ifRevisionId(revision) { calls.push(["revision", revision]); return this; }, set(fields) { calls.push(["fields", fields]); return this; }, unset() { return this; } };
      configure(patch);
    },
    createOrReplace(document) { calls.push(["replace", document._id]); },
    async commit() { calls.push(["commit"]); },
  };
  const client = {
    config: () => ({ projectId: "test", dataset: "test" }),
    fetch: async (_query, { id }) => id.startsWith("drafts.") ? { _id: id, _rev: "revision-1", title: "Keep title", slug: { current: "example" }, blocks: [] } : null,
    transaction() { calls.push(["transaction"]); return transaction; },
  };
  try {
    await main([file], () => client);
    assert.deepEqual(calls, []);
    await main([file, "--apply"], () => client);
    assert.deepEqual(calls.filter(([type]) => ["patch", "replace", "revision", "commit"].includes(type)), [["patch", "drafts.example"], ["revision", "revision-1"], ["patch", "drafts.example-faq"], ["revision", "revision-1"], ["replace", "drafts.example-faq"], ["commit"]]);
    assert.equal(calls.find(([type]) => type === "fields")[1].title, "Keep title");
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("an existing-page seed may omit blocks, and new supporting drafts are created", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "page-tools-"));
  const file = path.join(directory, "seed.mjs");
  await writeFile(file, 'export default { page: { _id: "example", title: "New title" }, documents: [{ _id: "example-faq", _type: "faq" }] };');
  const calls = [];
  const transaction = {
    patch(id, configure) {
      calls.push(["patch", id]);
      configure({ ifRevisionId() { return this; }, set(fields) { calls.push(["fields", fields]); return this; }, unset() { return this; } });
    },
    create(document) { calls.push(["create", document._id]); },
    createOrReplace(document) { calls.push(["replace", document._id]); },
    async commit() { calls.push(["commit"]); },
  };
  const client = {
    config: () => ({ projectId: "test", dataset: "test" }),
    fetch: async (_query, { id }) => id === "drafts.example" ? { _id: id, _rev: "revision-1", title: "Old title", slug: { current: "example" }, blocks: [{ _key: "keep", _type: "exampleBlock" }] } : null,
    transaction() { return transaction; },
  };
  try {
    await main([file, "--apply"], () => client);
    assert.deepEqual(calls.filter(([type]) => type !== "fields"), [["patch", "drafts.example"], ["create", "drafts.example-faq"], ["commit"]]);
    const fields = calls.find(([type]) => type === "fields")[1];
    assert.equal(fields.title, "New title");
    assert.deepEqual(fields.blocks.map((block) => block._key), ["keep"]);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("a seed's remove list deletes each id and its draft in the same transaction, after the writes", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "page-tools-"));
  const file = path.join(directory, "seed.mjs");
  await writeFile(file, 'export default { page: { _id: "new-page", slug: "new-page", title: "New" }, remove: ["old-page"] };');
  const calls = [];
  const transaction = {
    create(document) { calls.push(["create", document._id]); },
    delete(id) { calls.push(["delete", id]); },
    async commit() { calls.push(["commit"]); },
  };
  const client = {
    config: () => ({ projectId: "test", dataset: "test" }),
    fetch: async () => null,
    transaction() { calls.push(["transaction"]); return transaction; },
  };
  const log = console.log;
  const printed = [];
  console.log = (line) => printed.push(line);
  try {
    await main([file], () => client);
    assert.deepEqual(calls, []);
    assert.deepEqual(JSON.parse(printed[0]).remove, ["old-page", "drafts.old-page"]);
    await main([file, "--apply"], () => client);
    assert.deepEqual(calls, [["transaction"], ["create", "drafts.new-page"], ["delete", "old-page"], ["delete", "drafts.old-page"], ["commit"]]);
  } finally {
    console.log = log;
    await rm(directory, { recursive: true, force: true });
  }
});

async function assetSeed(run) {
  const directory = await mkdtemp(path.join(tmpdir(), "page-tools-"));
  const file = path.join(directory, "seed.mjs");
  await writeFile(file, `export default {
    page: { _id: "new-page", slug: "new-page", title: "New" },
    assets: [
      { id: "image-present-1x1-png", filename: "starter-present.png", buffer: Buffer.from("present") },
      { id: "image-missing-1x1-png", filename: "starter-missing.png", buffer: Buffer.from("missing") },
    ],
  };`);
  const calls = [];
  const client = {
    uploadedId: (id) => id,
    config: () => ({ projectId: "test", dataset: "test" }),
    fetch: async (query, params) => {
      if (params.ids) { calls.push(["lookup", params.ids]); return params.ids.filter((id) => id.includes("present")); }
      return null;
    },
    assets: {
      async upload(type, buffer, options) {
        calls.push(["upload", type, buffer.toString(), options]);
        return { _id: client.uploadedId(`image-${buffer.toString()}-1x1-png`) };
      },
    },
    transaction() {
      calls.push(["transaction"]);
      return { create(document) { calls.push(["create", document._id]); }, async commit() { calls.push(["commit"]); } };
    },
  };
  const log = console.log;
  const printed = [];
  console.log = (line) => printed.push(line);
  try {
    await run({ file, calls, client, printed });
  } finally {
    console.log = log;
    await rm(directory, { recursive: true, force: true });
  }
}

test("a seed's missing assets are uploaded with their filename before the transaction; present ones are not", async () => {
  await assetSeed(async ({ file, calls, client }) => {
    await main([file, "--apply"], () => client);
    assert.deepEqual(calls, [
      ["lookup", ["image-present-1x1-png", "image-missing-1x1-png"]],
      ["upload", "image", "missing", { filename: "starter-missing.png", contentType: "image/png" }],
      ["transaction"],
      ["create", "drafts.new-page"],
      ["commit"],
    ]);
  });
});

test("a seed dry run lists the assets it would upload and uploads nothing", async () => {
  await assetSeed(async ({ file, calls, client, printed }) => {
    await main([file], () => client);
    assert.deepEqual(calls.filter(([type]) => type !== "lookup"), []);
    assert.deepEqual(JSON.parse(printed[0]).assetsToUpload, ["image-missing-1x1-png (starter-missing.png)"]);
  });
});

test("an uploaded asset with an unexpected id stops the seed before it writes", async () => {
  await assetSeed(async ({ file, calls, client }) => {
    client.uploadedId = () => "image-other-1x1-png";
    await assert.rejects(main([file, "--apply"], () => client), /starter-missing\.png as image-other-1x1-png, but the seed references image-missing-1x1-png/);
    assert.equal(calls.some(([type]) => type === "transaction"), false);
  });
});

test("the Block library seed exports the placeholders its pages reference, named as the Starter seed names them", {
  skip: LIBRARY_PAGE_IDS.length === 0 && "this site has no Relume blocks",
}, async () => {
  const { default: librarySeed } = await import("./block-library-page.seed.mjs");
  const { STARTER_ASSETS } = await import("./seed.mjs");
  const serialized = JSON.stringify([librarySeed.page, ...librarySeed.documents]);
  const referenced = STARTER_ASSETS.filter((asset) => serialized.includes(asset.id));
  assert.ok(referenced.length > 0);
  assert.deepEqual(
    librarySeed.assets.map(({ id, filename, contentType }) => ({ id, filename, contentType })),
    referenced.map((asset) => ({ id: asset.id, filename: `starter-${asset.name}.png`, contentType: "image/png" })),
  );
  for (const asset of librarySeed.assets) {
    assert.equal(asset.buffer, STARTER_ASSETS.find((source) => source.id === asset.id).buffer);
  }
});

// A site without Relume blocks has no Block library pages to seed.
test("the Block library seed writes the block pages and removes the retired pages", {
  skip: LIBRARY_PAGE_IDS.length === 0 && "this site has no Relume blocks",
}, async () => {
  const { default: librarySeed } = await import("./block-library-page.seed.mjs");
  const { STARTER_SEED, BLOCK_LIBRARY_BLOCK_PAGE_IDS, RETIRED_STARTER_PAGE_IDS } = await import("./seed.mjs");
  // The block pages, the same pages `pnpm seed` writes: the first is the
  // seed's page, the rest its supporting drafts.
  assert.deepEqual(
    [librarySeed.page._id, ...librarySeed.documents.map((document) => document._id)],
    BLOCK_LIBRARY_BLOCK_PAGE_IDS,
  );
  assert.match(librarySeed.page.slug, /^block-library(\/[a-z0-9-]+){2,3}$/);
  // unseed removes only marked Starter documents, so every page carries the marker.
  assert.deepEqual(librarySeed.page._starterSeed, STARTER_SEED);
  for (const document of librarySeed.documents) {
    assert.equal(document._type, "page");
    assert.match(document.slug.current, /^block-library(\/[a-z0-9-]+){2,3}$/);
    assert.deepEqual(document._starterSeed, STARTER_SEED);
  }
  // The index (now a Website route), the category pages and the Section
  // library page before them are deleted, and nothing else.
  assert.deepEqual(librarySeed.remove, RETIRED_STARTER_PAGE_IDS);
  assert.deepEqual(librarySeed.remove.slice(0, 2), [
    "starter-page-section-library",
    "starter-page-block-library",
  ]);
  for (const id of librarySeed.remove.slice(2)) {
    assert.match(id, /^starter-page-block-library-[a-z0-9-]+$/);
    assert.equal(BLOCK_LIBRARY_BLOCK_PAGE_IDS.includes(id), false, id);
  }
  // Block pages link to each other by slug, never by reference.
  const references = [];
  (function collect(value) {
    if (!value || typeof value !== "object") return;
    if (value._type === "reference" && value._ref.startsWith("starter-page-block-library")) references.push(value);
    for (const child of Object.values(value)) collect(child);
  })([librarySeed.page, ...librarySeed.documents]);
  assert.deepEqual(references, []);
});

test("page URLs lose their query string and fragment", () => {
  assert.equal(normalizeSlug("https://example.com/about/team?preview=1#top"), "about/team");
  assert.equal(normalizeSlug("/about/"), "about");
});
