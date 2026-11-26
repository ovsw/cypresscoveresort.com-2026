// The Relume shelf: the manifest, `pnpm relume:add` and `pnpm relume:remove`.
// Add and remove run against temporary copies of this repository, never the
// real tree. See docs/agents/relume-import.md, "Shelf".
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  addBlocks,
  documentsUsing,
  listShelf,
  removeBlocks,
  ShelfRefusal,
  startSiteEmpty,
  withShelfRoot,
} from "./relume/lib/shelf.mjs";
import {
  buildShelf,
  isStarterCheckout,
  readShelf,
  registeredSlugs,
} from "./relume/lib/shelf-manifest.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const passingSteps = {
  typegen: () => ({ ok: true, output: "" }),
  checks: () => [{ name: "Checks", ok: true, output: "" }],
};
const noDocuments = async () => [];

// These tests copy the Starter's own blocks. A Website has only the ones
// it added, and a shelf manifest that is the Starter's, so they skip there.
const starterOnly = {
  skip: !isStarterCheckout(repoRoot) && "only in the Starter, which holds every block on the shelf",
};

// The files a block touches, copied once per test.
let trackedFiles;
function listTrackedFiles() {
  trackedFiles ??= execFileSync(
    "git",
    ["-C", repoRoot, "ls-files", "--cached", "--others", "--exclude-standard", "frontend", "studio", "docs", "shared", "relume/catalogue.json", "relume/shelf.json"],
    { encoding: "utf8" },
  )
    .split("\n")
    .filter(Boolean)
    .filter((file) => existsSync(join(repoRoot, file)));
  return trackedFiles;
}

function copyRepository(t) {
  const root = mkdtempSync(join(tmpdir(), "relume-shelf-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const file of listTrackedFiles()) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    cpSync(join(repoRoot, file), join(root, file));
  }
  return root;
}

function snapshot(root) {
  const files = {};
  const walk = (directory) => {
    for (const entry of readdirSync(directory)) {
      const full = join(directory, entry);
      if (statSync(full).isDirectory()) walk(full);
      else files[relative(root, full)] = readFileSync(full, "utf8");
    }
  };
  walk(root);
  return files;
}

const read = (root, file) => readFileSync(join(root, file), "utf8");

async function emptySite(t) {
  const root = copyRepository(t);
  await removeBlocks({ root, all: true, findDocuments: noDocuments, steps: passingSteps });
  return root;
}

test("relume/shelf.json lists exactly the blocks registered in the Starter", starterOnly, async () => {
  const shelf = await readShelf(repoRoot);
  assert.deepEqual(
    shelf.sections.map((block) => block.slug),
    await registeredSlugs(repoRoot),
    "Run pnpm relume:shelf to rewrite relume/shelf.json.",
  );
  assert.deepEqual(shelf, await buildShelf(repoRoot), "Run pnpm relume:shelf to rewrite relume/shelf.json.");
});

test("a manifest record names the block's files, shared files and packages", starterOnly, async () => {
  const shelf = await readShelf(repoRoot);
  const header141 = shelf.sections.find((block) => block.slug === "header141");
  assert.ok(header141, "header141 is on the shelf");
  assert.equal(header141.type, "relumeHeader141");
  assert.equal(header141.files.client, "frontend/components/blocks/relume/header141.client.tsx");
  assert.ok(header141.shared.includes("frontend/components/blocks/relume/block-editing.ts"));
  assert.ok(header141.shared.includes("frontend/sanity/queries/shared/button.ts"));
  assert.ok(header141.packages.motion, "motion is listed with a version");
  assert.match(header141.libraryEntry, /^- `relumeHeader141` /);
  const layout16 = shelf.sections.find((block) => block.slug === "layout16");
  assert.equal(layout16.files.client, undefined);
  assert.deepEqual(layout16.packages, {});
});

test("a block with a Studio thumbnail keeps it in its files", starterOnly, async (t) => {
  const root = copyRepository(t);
  const thumbnail = "studio/static/images/preview/relumeLayout16.jpg";
  mkdirSync(dirname(join(root, thumbnail)), { recursive: true });
  writeFileSync(join(root, thumbnail), "jpg");
  const layout16 = (await buildShelf(root)).sections.find((block) => block.slug === "layout16");
  assert.equal(layout16.files.thumbnail, thumbnail);
});

test("an add holds the shared shelf copy, and a second add waits its turn", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "relume-shelf-site-"));
  const cacheDir = join(root, "cache", "relume-shelf");
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(`${cacheDir}.lock`, { recursive: true });
  let ran = false;
  await assert.rejects(
    withShelfRoot(root, { cacheDir }, () => {
      ran = true;
    }),
    (error) => error instanceof ShelfRefusal && /Another relume command is using the shelf copy/.test(error.message),
  );
  assert.equal(ran, false);
  assert.ok(existsSync(`${cacheDir}.lock`), "the other add's lock stays");

  // The shelf page makes the copy under the same lock when it has none yet.
  await assert.rejects(
    withShelfRoot(root, { cacheDir, refresh: false }, () => {
      ran = true;
    }),
    ShelfRefusal,
  );
  assert.equal(ran, false);
});

test("remove --all leaves no Relume block registered and keeps shared files", starterOnly, async (t) => {
  const root = copyRepository(t);
  const packageBefore = read(root, "frontend/package.json");
  const result = await removeBlocks({
    root,
    all: true,
    findDocuments: noDocuments,
    steps: passingSteps,
  });
  assert.equal(result.removed.length, (await readShelf(repoRoot)).sections.length);
  assert.deepEqual(await registeredSlugs(root), []);
  for (const file of [
    "studio/schemas/blocks/page-builder.ts",
    "studio/schema-types.ts",
    "frontend/sanity/queries/page-builder.ts",
    "frontend/components/blocks/index.tsx",
  ]) {
    assert.doesNotMatch(read(root, file), /relume[A-Z]|Relume[A-Z]\w*[0-9]/, file);
  }
  assert.doesNotMatch(read(root, "docs/content-model.md"), /^- `relume/m);
  assert.doesNotMatch(read(root, "studio/scripts/seed-relume-blocks.mjs"), /_type:/);
  assert.match(read(root, "studio/scripts/seed-relume-blocks.mjs"), /\/\/ relume-seed:blocks/);
  assert.deepEqual(readdirSync(join(root, "studio/schemas/blocks/relume")), []);
  // No thumbnail outlives its block, and none stays registered.
  assert.deepEqual(
    readdirSync(join(root, "studio/static/images/preview")).filter((file) => /^relume/.test(file)),
    [],
  );
  assert.deepEqual(readdirSync(join(root, "frontend/components/blocks/relume")).sort(), [
    "block-accordion.tsx",
    "block-buttons.tsx",
    "block-date.ts",
    "block-editing.ts",
    "block-image.tsx",
    "block-link.tsx",
    "block-social-links.tsx",
    "block-stars.tsx",
    "block-tabs.tsx",
    "block-video-dialog.tsx",
  ]);
  assert.ok(existsSync(join(root, "frontend/sanity/queries/shared/button.ts")));
  assert.equal(read(root, "frontend/package.json"), packageBefore);
});

test("add registers exactly the named blocks, one plain and one with a client file", starterOnly, async (t) => {
  const shelfRoot = copyRepository(t);
  const root = await emptySite(t);
  const result = await addBlocks({
    root,
    shelfRoot,
    slugs: ["layout16", "header141"],
    steps: passingSteps,
  });
  assert.deepEqual(result.added, ["layout16", "header141"]);
  assert.deepEqual(await registeredSlugs(root), ["layout16", "header141"]);
  for (const file of [
    "studio/schemas/blocks/relume/layout16.ts",
    "frontend/sanity/queries/relume/layout16.ts",
    "frontend/components/blocks/relume/layout16.tsx",
    "frontend/components/blocks/relume/header141.tsx",
    "frontend/components/blocks/relume/header141.client.tsx",
  ]) {
    assert.equal(read(root, file), read(shelfRoot, file), file);
  }
  assert.match(read(root, "studio/schemas/blocks/page-builder.ts"), /"relumeLayout16",\n {2}"relumeHeader141",/);
  // Each block's thumbnail comes with it and is registered for the insert menu.
  for (const type of ["relumeLayout16", "relumeHeader141"]) {
    const thumbnail = `studio/static/images/preview/${type}.jpg`;
    assert.ok(readFileSync(join(root, thumbnail)).equals(readFileSync(join(shelfRoot, thumbnail))), thumbnail);
  }
  assert.match(
    read(root, "studio/schemas/blocks/page-builder.ts"),
    /"relumeLayout16",\n {2}"relumeHeader141",\n {2}\/\/ page-builder-generator:preview-types/,
  );
  assert.match(read(root, "frontend/components/blocks/index.tsx"), /relumeHeader141: RelumeHeader141,/);
  const library = read(root, "docs/content-model.md");
  assert.match(library, /^- `relumeLayout16` /m);
  assert.match(library, /^- `relumeHeader141` /m);
  const seed = read(root, "studio/scripts/seed-relume-blocks.mjs");
  assert.match(seed, /_type: "relumeLayout16",[\s\S]*_type: "relumeHeader141",/);
  // motion is still in the copy's package.json, so the checks ran.
  assert.ok(result.notes.includes("Checks passed."));
  assert.deepEqual(
    (await listShelf({ root, shelfRoot })).filter((block) => block.inSite).map((s) => s.slug),
    ["layout16", "header141"],
  );
});

test("add copies a missing shared file and package, and leaves a differing one alone", starterOnly, async (t) => {
  const shelfRoot = copyRepository(t);
  const root = await emptySite(t);
  rmSync(join(root, "frontend/components/blocks/relume/block-editing.ts"));
  writeFileSync(join(root, "frontend/components/blocks/relume/block-image.tsx"), "// this site's own\n");
  const frontendPackage = JSON.parse(read(root, "frontend/package.json"));
  delete frontendPackage.dependencies.motion;
  writeFileSync(join(root, "frontend/package.json"), `${JSON.stringify(frontendPackage, null, 2)}\n`);

  let checked = false;
  const result = await addBlocks({
    root,
    shelfRoot,
    slugs: ["header141"],
    steps: { ...passingSteps, checks: () => ((checked = true), []) },
  });
  assert.equal(
    read(root, "frontend/components/blocks/relume/block-editing.ts"),
    read(shelfRoot, "frontend/components/blocks/relume/block-editing.ts"),
  );
  assert.equal(read(root, "frontend/components/blocks/relume/block-image.tsx"), "// this site's own\n");
  assert.ok(result.notes.some((note) => /Left frontend\/components\/blocks\/relume\/block-image\.tsx/.test(note)));
  const after = JSON.parse(read(root, "frontend/package.json"));
  assert.equal(after.dependencies.motion, JSON.parse(read(shelfRoot, "frontend/package.json")).dependencies.motion);
  assert.ok(result.notes.some((note) => /Run pnpm install/.test(note)));
  assert.equal(checked, false, "the checks wait for pnpm install");
});

test("add refuses a block the site has; --force replaces its files", starterOnly, async (t) => {
  const shelfRoot = copyRepository(t);
  const root = copyRepository(t);
  const component = "frontend/components/blocks/relume/layout16.tsx";
  writeFileSync(join(root, component), `${read(root, component)}// local change\n`);
  const before = snapshot(root);

  await assert.rejects(
    addBlocks({ root, shelfRoot, slugs: ["layout16"], steps: passingSteps }),
    (error) => error instanceof ShelfRefusal && /Already in this site: layout16.*--force/.test(error.message),
  );
  assert.deepEqual(snapshot(root), before);

  const result = await addBlocks({ root, shelfRoot, slugs: ["layout16"], force: true, steps: passingSteps });
  assert.deepEqual(result.replaced, ["layout16"]);
  assert.equal(read(root, component), read(shelfRoot, component));
  // Everything else is as it was: the registrations went back in place.
  const after = snapshot(root);
  delete before[component];
  delete after[component];
  assert.deepEqual(after, before);
});

test("add refuses a block that is not on the shelf", starterOnly, async (t) => {
  const shelfRoot = copyRepository(t);
  const root = await emptySite(t);
  await assert.rejects(
    addBlocks({ root, shelfRoot, slugs: ["layout9999"], steps: passingSteps }),
    (error) => error instanceof ShelfRefusal && /not on the shelf/.test(error.message),
  );
});

test("a failed check leaves no half-registered block", starterOnly, async (t) => {
  const shelfRoot = copyRepository(t);
  const root = await emptySite(t);
  const before = snapshot(root);
  await assert.rejects(
    addBlocks({
      root,
      shelfRoot,
      slugs: ["layout16", "header141"],
      steps: { ...passingSteps, checks: () => [{ name: "Type check", ok: false, output: "error TS2304" }] },
    }),
    /Type check failed:\nerror TS2304/,
  );
  assert.deepEqual(snapshot(root), before);
});

test("remove stops and lists the documents that use a block", starterOnly, async (t) => {
  const root = copyRepository(t);
  const before = snapshot(root);
  let asked;
  await assert.rejects(
    removeBlocks({
      root,
      slugs: ["layout16"],
      steps: passingSteps,
      findDocuments: async (types) => {
        asked = types;
        return [{ _id: "drafts.page-about", _type: "page", title: "About", types: ["relumeLayout16"] }];
      },
    }),
    (error) =>
      error instanceof ShelfRefusal &&
      /drafts\.page-about \(page, "About"\): relumeLayout16/.test(error.message),
  );
  assert.deepEqual(asked, ["relumeLayout16"]);
  assert.deepEqual(snapshot(root), before);

  await removeBlocks({ root, slugs: ["layout16"], findDocuments: noDocuments, steps: passingSteps });
  assert.ok(!(await registeredSlugs(root)).includes("layout16"));
  assert.ok(!existsSync(join(root, "frontend/components/blocks/relume/layout16.tsx")));
  assert.doesNotMatch(read(root, "studio/scripts/seed-relume-blocks.mjs"), /relumeLayout16/);
  assert.match(read(root, "studio/scripts/seed-relume-blocks.mjs"), /relumeLayout240/);
});

test("remove refuses a block the site does not have", starterOnly, async (t) => {
  const root = await emptySite(t);
  await assert.rejects(
    removeBlocks({ root, slugs: ["layout16"], findDocuments: noDocuments, steps: passingSteps }),
    (error) => error instanceof ShelfRefusal && /Not in this site: layout16/.test(error.message),
  );
});

test("the dataset check asks for drafts and versions too, with the site's token", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "relume-shelf-env-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  await assert.rejects(documentsUsing(root, ["relumeLayout16"], fetch), /Run pnpm setup first/);

  mkdirSync(join(root, "studio"));
  writeFileSync(
    join(root, "studio/.env.local"),
    "SANITY_STUDIO_PROJECT_ID=abc123\nSANITY_STUDIO_DATASET=production\nSANITY_AUTH_TOKEN=secret\n",
  );
  let request;
  const documents = await documentsUsing(root, ["relumeLayout16"], async (url, init) => {
    request = { url: new URL(url), init };
    return Response.json({ result: [{ _id: "page-1", _type: "page", types: ["relumeLayout16", "relumeLayout16"] }] });
  });
  assert.deepEqual(documents, [{ _id: "page-1", _type: "page", types: ["relumeLayout16"] }]);
  assert.equal(request.url.host, "abc123.api.sanity.io");
  assert.equal(request.url.pathname, "/v2026-03-23/data/query/production");
  assert.equal(request.url.searchParams.get("perspective"), "raw");
  assert.equal(request.url.searchParams.get("$types"), '["relumeLayout16"]');
  assert.equal(request.init.headers.Authorization, "Bearer secret");
});

test("site setup empties a fresh site once, and never a site that has chosen", starterOnly, async (t) => {
  const shelfRoot = copyRepository(t);
  const root = copyRepository(t);
  const options = { findDocuments: noDocuments, steps: passingSteps };
  const first = await startSiteEmpty({ root, ...options });
  assert.equal(first.removed.length, (await readShelf(repoRoot)).sections.length);
  assert.deepEqual(await registeredSlugs(root), []);
  // Only the built-in blocks keep a thumbnail, and only theirs are registered.
  assert.deepEqual(
    readdirSync(join(root, "studio/static/images/preview")).sort(),
    ["richTextBlock.jpg", "scaffold.jpg"],
  );
  assert.doesNotMatch(read(root, "studio/schemas/blocks/page-builder.ts"), /"relume[A-Z]/);

  // The marker of a fresh site goes, so setup never empties the site again,
  // even once it has added every block on the shelf.
  assert.equal(existsSync(join(root, "relume/shelf.json")), false);
  await addBlocks({ root, shelfRoot, slugs: ["layout16"], steps: passingSteps });
  const again = await startSiteEmpty({ root, ...options });
  assert.deepEqual(again.removed, []);
  assert.deepEqual(await registeredSlugs(root), ["layout16"]);

  const everySlug = await registeredSlugs(shelfRoot);
  await addBlocks({
    root,
    shelfRoot,
    slugs: everySlug.filter((slug) => slug !== "layout16"),
    steps: passingSteps,
  });
  const full = await startSiteEmpty({ root, ...options });
  assert.deepEqual(full.removed, []);
  assert.equal((await registeredSlugs(root)).length, everySlug.length);

  // A site that removed some blocks before its first setup has chosen too:
  // setup keeps them and drops the marker, so adding the rest later is safe.
  const partial = copyRepository(t);
  await removeBlocks({ root: partial, slugs: ["layout16"], ...options });
  const kept = await startSiteEmpty({ root: partial, ...options });
  assert.deepEqual(kept.removed, []);
  assert.equal(existsSync(join(partial, "relume/shelf.json")), false);
  await addBlocks({ root: partial, shelfRoot, slugs: ["layout16"], steps: passingSteps });
  const later = await startSiteEmpty({ root: partial, ...options });
  assert.deepEqual(later.removed, []);
  assert.equal((await registeredSlugs(partial)).length, everySlug.length);
});
