import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  BLOCK_LIBRARY_BLOCK_PAGE_IDS,
  LEGACY_BLOCK_LIBRARY_PAGE_ID,
  LEGACY_STARTER_ASSET_IDS,
  RETIRED_STARTER_DOCUMENT_IDS,
  RETIRED_STARTER_PAGE_IDS,
  STARTER_ASSETS,
  STARTER_DOCUMENT_TYPES,
  STARTER_IMAGE_ASSET_ID,
  seed,
  starterDocuments,
  unseed,
} from "./seed.mjs";

function createFakeClient({
  count = 0,
  documents = starterDocuments,
  assetRefs = [],
} = {}) {
  const calls = {
    commits: [],
    uploads: [],
  };

  const client = {
    calls,
    assets: {
      async upload(type, body, options) {
        calls.uploads.push({ body, options, type });
        return {
          _id: STARTER_ASSETS.find(
            (asset) => options.filename === `starter-${asset.name}.png`,
          ).id,
        };
      },
    },
    async fetch(query) {
      if (query.startsWith("count(")) return count;
      if (query.includes(".blocks[].image.asset._ref")) return assetRefs;
      if (query.startsWith("*[_id in $ids")) return documents;
      throw new Error(`Unexpected query: ${query}`);
    },
    transaction() {
      const operations = [];
      return {
        createIfNotExists(document) {
          operations.push({ document, op: "createIfNotExists" });
          return this;
        },
        delete(id) {
          operations.push({ id, op: "delete" });
          return this;
        },
        async commit() {
          calls.commits.push(operations);
        },
      };
    },
  };

  return client;
}

test("seed writes only after confirming the dataset is empty", async () => {
  const client = createFakeClient();
  const result = await seed(client);

  assert.equal(result.documents, STARTER_DOCUMENT_TYPES.size);
  assert.equal(client.calls.uploads.length, STARTER_ASSETS.length);
  assert.equal(client.calls.commits.length, 1);
  assert.deepEqual(
    client.calls.commits[0].map((operation) => operation.document._id),
    starterDocuments.map((document) => document._id),
  );
});

test("seed refuses to write into a non-empty dataset", async () => {
  const client = createFakeClient({ count: 1 });

  await assert.rejects(
    seed(client),
    /destination dataset is not empty \(1 documents found\)/,
  );
  assert.equal(client.calls.uploads.length, 0);
  assert.equal(client.calls.commits.length, 0);
});

test("unseed deletes marked starter IDs and preserves unrelated documents", async () => {
  const client = createFakeClient({
    assetRefs: [STARTER_IMAGE_ASSET_ID, "image-extra-owned"],
  });
  const result = await unseed(client);
  const deletedIds = client.calls.commits[0].map((operation) => operation.id);

  assert.deepEqual(result, {
    assets: STARTER_ASSETS.length + LEGACY_STARTER_ASSET_IDS.length,
    documents: STARTER_DOCUMENT_TYPES.size,
  });
  assert.deepEqual(deletedIds, [
    ...STARTER_DOCUMENT_TYPES.keys(),
    ...RETIRED_STARTER_PAGE_IDS,
    ...STARTER_ASSETS.map((asset) => asset.id),
    ...LEGACY_STARTER_ASSET_IDS,
  ]);
  assert.equal(deletedIds.includes("unrelated-document"), false);
  assert.equal(deletedIds.includes("image-extra-owned"), false);
});

const marked = (_id) => ({
  _id,
  _type: "page",
  _starterSeed: starterDocuments[0]._starterSeed,
});
// The retired Block library index and category pages (the first retired id
// is the Section library page before them).
const retiredLibraryPageIds = RETIRED_STARTER_PAGE_IDS.filter(
  (id) => id !== LEGACY_BLOCK_LIBRARY_PAGE_ID,
);
// A site keeps only the Relume blocks it took from the Starter's shelf; with
// none, there are no Block library pages, so the tests about them skip.
const needsLibrary = {
  skip: BLOCK_LIBRARY_BLOCK_PAGE_IDS.length === 0 && "this site has no Relume blocks",
};

test("seed writes no index or category page, only block pages", needsLibrary, () => {
  const ids = starterDocuments.map((document) => document._id);
  for (const id of RETIRED_STARTER_PAGE_IDS) assert.equal(ids.includes(id), false, id);
  for (const id of BLOCK_LIBRARY_BLOCK_PAGE_IDS) assert.ok(ids.includes(id), id);
  assert.deepEqual(retiredLibraryPageIds.slice(0, 1), ["starter-page-block-library"]);
  assert.ok(retiredLibraryPageIds.length > 1, "one category page id per category");
});

test("unseed empties a dataset seeded before the Block library rename", async () => {
  // That seed wrote the library page as starter-page-section-library.
  const client = createFakeClient({
    documents: [
      ...starterDocuments.filter(
        (document) => !BLOCK_LIBRARY_BLOCK_PAGE_IDS.includes(document._id),
      ),
      marked(LEGACY_BLOCK_LIBRARY_PAGE_ID),
    ],
  });
  await unseed(client);
  const deletedIds = client.calls.commits[0].map((operation) => operation.id);

  assert.ok(deletedIds.includes(LEGACY_BLOCK_LIBRARY_PAGE_ID));
});

test("unseed deletes the retired Block library index and category pages", async () => {
  const client = createFakeClient({
    documents: [...starterDocuments, ...retiredLibraryPageIds.map(marked)],
  });
  const result = await unseed(client);
  const deletedIds = client.calls.commits[0].map((operation) => operation.id);

  for (const id of retiredLibraryPageIds) assert.ok(deletedIds.includes(id), id);
  assert.equal(new Set(deletedIds).size, deletedIds.length, "Each id is deleted once.");
  assert.equal(
    result.documents,
    STARTER_DOCUMENT_TYPES.size + retiredLibraryPageIds.length,
  );
});

test("unseed removes a category page for a category no longer on the shelf", async () => {
  const stale = {
    _id: "starter-page-block-library-banners",
    _type: "page",
    _starterSeed: starterDocuments[0]._starterSeed,
  };
  const client = createFakeClient({ documents: [...starterDocuments, stale] });
  const result = await unseed(client);
  const deletedIds = client.calls.commits[0].map((operation) => operation.id);

  assert.ok(deletedIds.includes(stale._id));
  assert.equal(result.documents, STARTER_DOCUMENT_TYPES.size + 1);
});

test("unseed deletes the drafts page:seed wrote", needsLibrary, async () => {
  const drafts = [
    marked(`drafts.${retiredLibraryPageIds[0]}`),
    {
      ...starterDocuments.find((document) => document._id === BLOCK_LIBRARY_BLOCK_PAGE_IDS[0]),
      _id: `drafts.${BLOCK_LIBRARY_BLOCK_PAGE_IDS[0]}`,
    },
  ];
  const client = createFakeClient({ documents: [...starterDocuments, ...drafts] });
  await unseed(client);
  const deletedIds = client.calls.commits[0].map((operation) => operation.id);

  for (const draft of drafts) assert.ok(deletedIds.includes(draft._id), draft._id);
});

test("unseed refuses an unmarked draft at a Starter id", needsLibrary, async () => {
  const documents = [
    ...starterDocuments,
    { _id: `drafts.${retiredLibraryPageIds[1]}`, _type: "page" },
  ];
  const client = createFakeClient({ documents });

  await assert.rejects(unseed(client), /drafts\.starter-page-block-library-/);
  assert.equal(client.calls.commits.length, 0);
});

test("a draft alone does not count as a present Starter document", async () => {
  const documents = starterDocuments.map((document) =>
    document._id === "settings" ? { ...document, _id: "drafts.settings" } : document,
  );
  const client = createFakeClient({ documents });

  await assert.rejects(unseed(client), /missing Starter seed documents: settings/);
});

test("unseed refuses an unmarked page at a Block library category id", async () => {
  const documents = [
    ...starterDocuments,
    { _id: "starter-page-block-library-banners", _type: "page" },
  ];
  const client = createFakeClient({ documents });

  await assert.rejects(unseed(client), /starter-page-block-library-banners/);
  assert.equal(client.calls.commits.length, 0);
});

test("unseed refuses an unmarked document at the old library page id", async () => {
  const documents = [
    ...starterDocuments,
    { _id: LEGACY_BLOCK_LIBRARY_PAGE_ID, _type: "page" },
  ];
  const client = createFakeClient({ documents });

  await assert.rejects(unseed(client), new RegExp(LEGACY_BLOCK_LIBRARY_PAGE_ID));
  assert.equal(client.calls.commits.length, 0);
});

test("unseed refuses unmarked starter IDs", async () => {
  const documents = starterDocuments.map((document) =>
    document._id === "homePage"
      ? { _id: "homePage", _type: "homePage" }
      : document,
  );
  const client = createFakeClient({ documents });

  await assert.rejects(unseed(client), /homePage/);
  assert.equal(client.calls.commits.length, 0);
});

test("unseed refuses partial starter datasets", async () => {
  const client = createFakeClient({ documents: starterDocuments.slice(1) });

  await assert.rejects(
    unseed(client),
    /missing Starter seed documents: settings/,
  );
  assert.equal(client.calls.commits.length, 0);
});

test("seed reads Studio env directly instead of the legacy root env file", () => {
  const source = readFileSync(new URL("./seed.mjs", import.meta.url), "utf8");

  assert.doesNotMatch(source, /rootDirectory,\s*"\.env\.local"/);
  assert.match(source, /rootDirectory,\s*"studio",\s*"\.env\.local"/);
});

test("seed covers every block and uses only the bundled PNG assets", async () => {
  const { pageBuilderBlockTypes } =
    await import("../schemas/blocks/page-builder.ts");
  const blocks = starterDocuments.flatMap((document) => document.blocks ?? []);
  assert.deepEqual(
    new Set(blocks.map((block) => block._type)),
    new Set(pageBuilderBlockTypes),
  );
  const assets = new Set(STARTER_ASSETS.map((asset) => asset.id));
  function check(value) {
    if (!value || typeof value !== "object") return;
    if (value._type === "image") assert.ok(assets.has(value.asset._ref));
    for (const child of Object.values(value)) check(child);
  }
  check(starterDocuments);
});

test("seed archives one Scaffold and renders another", () => {
  const about = starterDocuments.find(
    (document) => document._id === "starter-page-about",
  );
  assert.deepEqual(
    about.blocksArchive.map((block) => block._type),
    ["scaffold"],
  );
  assert.equal(
    about.blocks.some((block) => block._type === "scaffold"),
    false,
  );
  const home = starterDocuments.find((document) => document._id === "homePage");
  const scaffold = home.blocks.find((block) => block._type === "scaffold");
  assert.ok(scaffold.name);
  assert.ok(scaffold.richText.length);
});

test("homepage seed demonstrates a seam and a straight edge", () => {
  const home = starterDocuments.find((document) => document._id === "homePage");
  const themed = home.blocks.filter((block) => block._type !== "scaffold");
  for (const block of themed) {
    assert.ok(["light", "dark"].includes(block.theme), block._key);
  }
  const joins = themed.slice(1).map((block, index) => ({
    match: themed[index].theme === block.theme,
  }));
  assert.ok(joins.some((join) => join.match));
  assert.ok(joins.some((join) => !join.match));
});

const retiredDocument = (marker, _type = "author") => ({
  _id: RETIRED_STARTER_DOCUMENT_IDS[0],
  _type,
  _starterSeed: marker,
});

test("unseed also deletes a marked sample document of a removed type", async () => {
  const marker = starterDocuments[0]._starterSeed;
  const client = createFakeClient({
    documents: [...starterDocuments, retiredDocument(marker)],
  });
  await unseed(client);
  const deletedIds = client.calls.commits[0].map((operation) => operation.id);

  assert.ok(deletedIds.includes(RETIRED_STARTER_DOCUMENT_IDS[0]));
  // The other retired document is not in the dataset, so it is not touched.
  assert.equal(deletedIds.includes(RETIRED_STARTER_DOCUMENT_IDS[1]), false);
});

test("unseed refuses when a removed type's document is not marked as seed content", async () => {
  const client = createFakeClient({
    documents: [...starterDocuments, retiredDocument(undefined)],
  });

  await assert.rejects(
    unseed(client),
    new RegExp(`not marked as Starter seed content: ${RETIRED_STARTER_DOCUMENT_IDS[0]}`),
  );
  assert.equal(client.calls.commits.length, 0);
});

test("unseed refuses when a removed type's ID holds a document of another type", async () => {
  const marker = starterDocuments[0]._starterSeed;
  const client = createFakeClient({
    documents: [...starterDocuments, retiredDocument(marker, "page")],
  });

  await assert.rejects(unseed(client), /not marked as Starter seed content/);
  assert.equal(client.calls.commits.length, 0);
});
