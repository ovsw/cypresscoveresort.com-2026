#!/usr/bin/env node
// Write a page draft, and the draft documents it depends on, from a seed
// module. Drafts only: nothing here publishes. The one exception is `remove`,
// which deletes documents a seed replaces (see below).
//
// Usage:
//   pnpm --dir studio page:seed <seed.mjs>            # dry run: prints the plan
//   pnpm --dir studio page:seed <seed.mjs> --apply    # writes the drafts
//
// The seed module default-exports:
//   {
//     page: {
//       _id: "examplePage",   // published id, without "drafts."
//       slug: "example-page", // only needed when the page is new
//       title, description, meta,                // optional, set when given
//       blocks: [ ...blocks with _key and _type ],
//     },
//     documents: [ { _id: "faq-example-1", _type: "faq", ... }, ... ],  // optional
//     remove: [ "old-example-page" ],  // optional
//     assets: [ { id: "image-<sha1>-<w>x<h>-png", filename, buffer } ],  // optional
//   }
//
// Behaviour:
// - the page draft is created from the published document when no draft
//   exists, or from scratch for a new page (slug and title required);
// - fields named in the seed replace the draft's fields; `blocks` replaces the
//   whole block list; fields not named are kept;
// - a draft that changed since it was read is not overwritten (revision guard);
// - supporting documents are written as drafts with createOrReplace, so give
//   them ids scoped to the page (e.g. "faq-example-return-flight");
// - array items missing a `_key` get a deterministic one;
// - each id in `remove` (a published id) is deleted with its draft, in the
//   same transaction as the writes, so a seed that moves a page to a new id
//   leaves no old copy behind. Deleting an id that does not exist does nothing;
// - each image in `assets` that the dataset lacks is uploaded before the
//   transaction (the dry run only lists them). Sanity derives an image
//   asset's id from its bytes, so the upload gets the id the documents
//   already reference; a different id stops the run before any page or
//   supporting draft is written (the images uploaded so far stay in the
//   dataset). Images already in the dataset are not uploaded again.
//
// Every reference to a supporting document in the same seed must be weak,
// whether it sits in the page or in another supporting document. The target
// exists only as a draft, and Sanity refuses a strong reference to an id with
// no published document: `--apply` then fails at commit, and the dry run does
// not show it. Write each such reference as
//   { _type: "reference", _ref: "faq-example-1", _weak: true,
//     _strengthenOnPublish: { type: "faq" } }
// (`_ref` is the published id; `type` is the target's `_type`). Sanity makes
// it strong when the referring document is published, so publish the target
// first: a document cannot be published while it points at an unpublished
// one. The script writes each `_ref` as given and does not add these fields.

import { createHash } from "node:crypto";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { uploadImageAsset } from "./lib/image-assets.mjs";
import { getPageToolsClient } from "./lib/page-tools-client.mjs";


function usage(message) {
  if (message) console.error(message);
  console.error("Usage: pnpm --dir studio page:seed <seed.mjs> [--apply]");
  process.exit(1);
}

function keyFor(pathParts) {
  return createHash("sha1").update(pathParts.join(".")).digest("base64url").slice(0, 12);
}

/** Give every object inside an array a `_key` when it lacks one. */
export function withKeys(value, pathParts = []) {
  if (Array.isArray(value)) {
    return value.map((item, index) => {
      const itemPath = [...pathParts, String(index)];
      if (item && typeof item === "object" && !Array.isArray(item)) {
        const keyed =
          typeof item._key === "string" && item._key
            ? item
            : { ...item, _key: keyFor(itemPath) };
        return withKeys(keyed, [...pathParts, keyed._key]);
      }
      return withKeys(item, itemPath);
    });
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, withKeys(item, [...pathParts, key])]),
    );
  }
  return value;
}

function summarizeBlocks(blocks = []) {
  return blocks.map((block, index) => `${index + 1}. ${block._type} (${block._key})`);
}

async function loadSeed(file) {
  // pnpm runs this from studio/; resolve the seed from where pnpm was invoked.
  const baseDirectory = process.env.INIT_CWD ?? process.cwd();
  const module = await import(pathToFileURL(path.resolve(baseDirectory, file)).href);
  const seed = module.default;
  if (!seed?.page?._id) usage("The seed must default-export { page: { _id, ... } }.");
  if (/^(drafts|versions)\./.test(seed.page._id)) usage("Use the published page ID, without a drafts. or versions. prefix.");
  // An existing page keeps its blocks when the seed omits them.
  if ("blocks" in seed.page && !Array.isArray(seed.page.blocks)) usage("page.blocks must be an array of blocks.");
  for (const block of seed.page.blocks ?? []) {
    if (!block?._type) usage("Every block needs a _type.");
  }
  const ids = new Set([seed.page._id]);
  for (const document of seed.documents ?? []) {
    if (!document?._id || !document?._type) usage("Every supporting document needs _id and _type.");
    if (/^(drafts|versions)\./.test(document._id)) usage("Use published supporting document IDs, without a drafts. or versions. prefix.");
    if (ids.has(document._id)) usage(`Duplicate document ID: ${document._id}`);
    ids.add(document._id);
  }
  if ("assets" in seed && !Array.isArray(seed.assets)) usage("assets must be an array of { id, filename, buffer }.");
  for (const asset of seed.assets ?? []) {
    if (typeof asset?.id !== "string" || !asset.id.startsWith("image-")) usage("Every asset needs the image asset id its bytes give (image-...).");
    if (typeof asset.filename !== "string" || !asset.filename) usage(`Asset ${asset.id} needs a filename.`);
    if (!Buffer.isBuffer(asset.buffer)) usage(`Asset ${asset.id} needs its bytes as a buffer.`);
  }
  if ("remove" in seed && !Array.isArray(seed.remove)) usage("remove must be an array of published document IDs.");
  for (const id of seed.remove ?? []) {
    if (typeof id !== "string" || !id) usage("Every id in remove must be a non-empty string.");
    if (/^(drafts|versions)\./.test(id)) usage("Use published IDs in remove, without a drafts. or versions. prefix; the draft is removed with it.");
    if (ids.has(id)) usage(`${id} is both written and removed by this seed.`);
  }
  return seed;
}

export async function main(args = process.argv.slice(2), clientFactory = getPageToolsClient) {
  const apply = args.includes("--apply");
  const file = args.find((argument) => !argument.startsWith("--"));
  if (!file) usage();

  const seed = await loadSeed(file);
  const client = clientFactory();
  const { dataset, projectId } = client.config();

  const { _id: pageId, slug, ...pageFields } = seed.page;
  const draftId = `drafts.${pageId}`;
  const [published, draft] = await Promise.all([
    client.fetch(`*[_id == $id][0]`, { id: pageId }, { perspective: "raw" }),
    client.fetch(`*[_id == $id][0]`, { id: draftId }, { perspective: "raw" }),
  ]);

  const base = draft ?? published;
  if (!base && !(slug && pageFields.title)) {
    usage(`Page ${pageId} does not exist; a new page needs slug and title in the seed.`);
  }
  const pageDocument = withKeys({
    ...(base ?? { _type: "page", slug: { _type: "slug", current: slug } }),
    ...pageFields,
    _id: draftId,
    _type: "page",
  });
  delete pageDocument._rev;
  delete pageDocument._createdAt;
  delete pageDocument._updatedAt;
  delete pageDocument._system;

  const documents = (seed.documents ?? []).map((document) =>
    withKeys({ ...document, _id: `drafts.${document._id}` }),
  );
  // Each removed id goes with its draft.
  const removeIds = (seed.remove ?? []).flatMap((id) => [id, `drafts.${id}`]);
  const existingDocuments = await Promise.all(
    documents.map((document) =>
      client.fetch(`*[_id == $id][0]{_id, _rev}`, { id: document._id }, { perspective: "raw" }),
    ),
  );
  // Image assets the seed's documents reference that the dataset lacks.
  const assets = seed.assets ?? [];
  const presentAssetIds = assets.length
    ? new Set(
        await client.fetch(`*[_id in $ids]._id`, { ids: assets.map((asset) => asset.id) }, { perspective: "raw" }),
      )
    : new Set();
  const missingAssets = assets.filter((asset) => !presentAssetIds.has(asset.id));

  const plan = {
    mode: apply ? "apply" : "dry-run",
    projectId,
    dataset,
    page: {
      id: draftId,
      from: draft ? "existing draft" : published ? "published copy" : "new page",
      slug: pageDocument.slug?.current,
      title: pageDocument.title,
      fieldsSet: Object.keys(pageFields),
      blocks: summarizeBlocks(pageDocument.blocks),
    },
    documents: documents.map(
      (document, index) =>
        `${document._id} (${document._type}, ${existingDocuments[index] ? "replace existing draft" : "new draft"})`,
    ),
    remove: removeIds,
    assetsToUpload: missingAssets.map((asset) => `${asset.id} (${asset.filename})`),
  };
  console.log(JSON.stringify(plan, null, 2));
  if (!apply) {
    console.log("Dry run. Add --apply to upload these assets and write these drafts.");
    return;
  }

  // Upload before the transaction, which would otherwise fail on a reference
  // to an asset the dataset does not have.
  for (const expected of missingAssets) {
    const asset = await uploadImageAsset(client, expected);
    if (asset._id !== expected.id) {
      throw new Error(
        `Uploaded ${expected.filename} as ${asset._id}, but the seed references ${expected.id}. Its bytes or its id are out of date. No page or supporting draft was written; the image assets uploaded so far stay in the dataset.`,
      );
    }
  }
  if (missingAssets.length) console.log(`Uploaded ${missingAssets.length} image asset(s).`);

  const transaction = client.transaction();
  if (draft) {
    const { _id, _type, ...fields } = pageDocument;
    transaction.patch(draftId, (patch) => patch.ifRevisionId(draft._rev).set(fields));
  } else {
    transaction.create(pageDocument);
  }
  documents.forEach((document, index) => {
    const existing = existingDocuments[index];
    if (!existing) {
      transaction.create(document);
      return;
    }
    // createOrReplace cannot carry a revision check, so a guarded patch goes
    // first: if this draft changed since it was read, the whole seed fails.
    transaction.patch(document._id, (patch) =>
      patch.ifRevisionId(existing._rev).unset(["__pageSeedGuard"]),
    );
    transaction.createOrReplace(document);
  });
  for (const id of removeIds) transaction.delete(id);

  try {
    await transaction.commit({ visibility: "async" });
  } catch (error) {
    if (`${error.message}`.includes("revision")) {
      console.error(
        `A draft in this seed changed while it ran (another session?). Re-read ${draftId} and its supporting drafts, then run again.`,
      );
      process.exit(3);
    }
    throw error;
  }
  console.log(`Wrote ${draftId}${documents.length ? ` and ${documents.length} supporting draft(s)` : ""}.`);
  if (removeIds.length) console.log(`Deleted (where present): ${removeIds.join(", ")}.`);
  console.log("Nothing was published.");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message ?? error);
    process.exit(1);
  });
}
