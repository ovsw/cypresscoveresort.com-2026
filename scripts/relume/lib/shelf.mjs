// Adding Relume blocks from the Starter's shelf to a Website, and removing
// them. `pnpm relume:add`, `pnpm relume:remove` and the /block-library
// page all run this code. See docs/agents/relume-import.md, "Shelf".

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { parseEnv } from "node:util";

import { applyPlan, buildPlan, buildRemovalPlan } from "../../create-page-builder-block.mjs";
import { planLibraryEntry, planSeedBlock } from "../convert.mjs";
import {
  existingBlockFiles,
  isStarterCheckout,
  libraryDocFile,
  readShelf,
  registeredSlugs,
  registrationFiles,
  blockFilePaths,
  SHELF_FILE,
  blockNames,
  seedBlockRange,
  seedModuleFile,
  STARTER_REPOSITORY,
  writeShelf,
} from "./shelf-manifest.mjs";

/** A stop the command explains: nothing was changed. */
export class ShelfRefusal extends Error {}

const generatedTypeFiles = ["studio/schema.json", "frontend/sanity.types.ts"];

// --- Getting the shelf ---

export const defaultCacheDir = join(
  process.env.XDG_CACHE_HOME || join(homedir(), ".cache"),
  "relume-shelf",
);

function git(args, options = {}) {
  const result = spawnSync("git", args, { encoding: "utf8", ...options });
  if (result.status !== 0) {
    throw new Error(
      `git ${args.join(" ")} failed:\n${(result.stderr || result.stdout || "").trim()}`,
    );
  }
  return result.stdout;
}

/**
 * A shallow copy of the Starter's default branch in `cacheDir`, made or
 * brought up to date with the developer's own git access. Returns its path.
 */
export function fetchShelf({
  cacheDir = defaultCacheDir,
  repository = STARTER_REPOSITORY,
} = {}) {
  if (existsSync(join(cacheDir, ".git"))) {
    git(["-C", cacheDir, "fetch", "--depth", "1", "origin", "HEAD"]);
    git(["-C", cacheDir, "reset", "--hard", "--quiet", "FETCH_HEAD"]);
  } else {
    git(["clone", "--depth", "1", "--quiet", repository, cacheDir]);
  }
  return cacheDir;
}

/**
 * Where the shelf comes from: `--from <path>`; this checkout when it is the
 * Starter; otherwise a fresh shallow copy from GitHub.
 */
export function resolveShelfRoot(root, { from, cacheDir = defaultCacheDir, refresh = true } = {}) {
  if (from) return resolve(from);
  if (isStarterCheckout(root)) return root;
  // The shelf page lists from the copy it has; adding gets the latest.
  if (!refresh && existsSync(join(cacheDir, SHELF_FILE))) return cacheDir;
  return fetchShelf({ cacheDir });
}

/**
 * Runs `work` with the shelf's path. Whenever the shared copy from GitHub is
 * made or refreshed, it is locked from then until `work` ends, so another
 * add or shelf page (from another site) cannot change its files halfway
 * through. `refresh: false` reuses the copy as it is, when there is one.
 */
export async function withShelfRoot(
  root,
  { from, cacheDir = defaultCacheDir, refresh = true } = {},
  work,
) {
  if (from || isStarterCheckout(root)) {
    return work(resolveShelfRoot(root, { from, cacheDir }));
  }
  // The shelf page lists from the copy it has, and only reads it.
  if (!refresh && existsSync(join(cacheDir, SHELF_FILE))) return work(cacheDir);
  return holdLock(
    `${cacheDir}.lock`,
    `Another relume command is using the shelf copy in ${cacheDir}. Retry when it finishes. If it crashed, remove the empty directory ${cacheDir}.lock.`,
    async () => work(fetchShelf({ cacheDir })),
  );
}

// --- Writing as one unit ---

async function snapshot(root, files) {
  const saved = new Map();
  for (const file of new Set(files)) {
    const full = resolve(root, file);
    saved.set(full, existsSync(full) ? await readFile(full) : null);
  }
  return saved;
}

async function restore(saved) {
  for (const [full, contents] of saved) {
    if (contents === null) await rm(full, { force: true });
    else {
      await mkdir(dirname(full), { recursive: true });
      await writeFile(full, contents);
    }
  }
}

async function withLock(root, work) {
  return holdLock(
    resolve(root, ".page-builder-generator.lock"),
    "Another generator run holds .page-builder-generator.lock. If it crashed, remove that empty directory before retrying.",
    work,
  );
}

async function holdLock(lockPath, refusal, work) {
  await mkdir(dirname(lockPath), { recursive: true });
  try {
    await mkdir(lockPath);
  } catch (error) {
    if (error.code === "EEXIST") throw new ShelfRefusal(refusal);
    throw error;
  }
  try {
    return await work();
  } finally {
    await rm(lockPath, { recursive: true, force: true });
  }
}

// --- Checks ---

function run(root, command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, FORCE_COLOR: "0" },
  });
  return {
    ok: result.status === 0,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim(),
  };
}

/** The real steps; tests pass stand-ins. */
export const defaultSteps = {
  typegen: (root) => run(root, "pnpm", ["typegen"]),
  checks: (root) => [
    { name: "Type check (pnpm typecheck)", ...run(root, "pnpm", ["typecheck"]) },
    {
      name: "Block tests (studio/schemas/blocks)",
      ...run(root, process.execPath, ["--test", "studio/schemas/blocks/*.test.mjs"]),
    },
  ],
};

function tail(output, lines = 30) {
  return output.split("\n").slice(-lines).join("\n");
}

async function regenerateAndCheck(root, steps, { skipChecks } = {}) {
  const typegen = await steps.typegen(root);
  if (!typegen.ok) {
    throw new Error(`Regenerating the Sanity types (pnpm typegen) failed:\n${tail(typegen.output)}`);
  }
  if (skipChecks) return [];
  const results = await steps.checks(root);
  const failed = results.filter((result) => !result.ok);
  if (failed.length) {
    throw new Error(
      failed.map((result) => `${result.name} failed:\n${tail(result.output)}`).join("\n\n"),
    );
  }
  return results.map((result) => `${result.name} passed.`);
}

// --- Removing ---

function withoutLibraryEntry(markdown, camel) {
  const pattern = new RegExp(`^- \`${camel}\`(?:\\s|$)`);
  return markdown
    .split("\n")
    .filter((line) => !pattern.test(line))
    .join("\n");
}

function withoutSeedBlock(source, camel) {
  const lines = source.split("\n");
  const range = seedBlockRange(lines, camel);
  if (!range) return source;
  lines.splice(range[0], range[1] - range[0] + 1);
  return lines.join("\n");
}

// Removes one registered block's files and registrations. No checks.
async function unregister(root, slug) {
  const { camel } = blockNames(slug);
  const plan = await buildRemovalPlan({
    root,
    name: camel,
    dir: "relume",
    fileName: slug,
    title: camel,
  });
  for (const [key, file] of Object.entries(plan.paths)) {
    await writeFile(file, plan.registrations[key], "utf8");
  }
  for (const file of Object.values(existingBlockFiles(root, slug))) {
    await rm(resolve(root, file), { force: true });
  }
  const libraryDoc = resolve(root, libraryDocFile);
  await writeFile(
    libraryDoc,
    withoutLibraryEntry(await readFile(libraryDoc, "utf8"), camel),
    "utf8",
  );
  const seedModule = resolve(root, seedModuleFile);
  if (existsSync(seedModule)) {
    await writeFile(
      seedModule,
      withoutSeedBlock(await readFile(seedModule, "utf8"), camel),
      "utf8",
    );
  }
}

function sanityConfig(root) {
  const read = (file) => {
    const path = resolve(root, file);
    return existsSync(path) ? parseEnv(readFileSync(path, "utf8")) : {};
  };
  const studio = read("studio/.env.local");
  const frontend = read("frontend/.env.local");
  return {
    projectId: studio.SANITY_STUDIO_PROJECT_ID || frontend.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: studio.SANITY_STUDIO_DATASET || frontend.NEXT_PUBLIC_SANITY_DATASET,
    token: studio.SANITY_AUTH_TOKEN || frontend.SANITY_API_READ_TOKEN,
    apiVersion:
      studio.SANITY_STUDIO_API_VERSION || frontend.NEXT_PUBLIC_SANITY_API_VERSION || "2026-03-23",
  };
}

/**
 * The documents in the Website's configured dataset, drafts and versions
 * included, whose Page Builder uses any of `types`.
 */
export async function documentsUsing(root, types, fetcher = fetch) {
  const { projectId, dataset, token, apiVersion } = sanityConfig(root);
  if (!projectId || !dataset || !token) {
    throw new ShelfRefusal(
      "Cannot check the dataset for pages that use these blocks: studio/.env.local needs SANITY_STUDIO_PROJECT_ID, SANITY_STUDIO_DATASET and SANITY_AUTH_TOKEN. Run pnpm setup first.",
    );
  }
  const query =
    '*[count(blocks[_type in $types]) > 0]{_id, _type, title, "types": blocks[_type in $types]._type}';
  const url = new URL(
    `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`,
  );
  url.searchParams.set("query", query);
  url.searchParams.set("$types", JSON.stringify(types));
  url.searchParams.set("perspective", "raw");
  let response;
  try {
    response = await fetcher(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(30000),
    });
  } catch (error) {
    throw new ShelfRefusal(
      `Could not reach the Sanity dataset to check for pages that use these blocks: ${error instanceof Error ? error.message : error}`,
    );
  }
  if (!response.ok) {
    throw new ShelfRefusal(
      `The Sanity dataset check failed (${response.status}): ${(await response.text()).slice(0, 300)}`,
    );
  }
  const { result } = await response.json();
  return result.map((document) => ({
    ...document,
    types: [...new Set(document.types)],
  }));
}

function describeDocuments(documents) {
  return documents
    .map(
      (document) =>
        `- ${document._id} (${document._type}${document.title ? `, "${document.title}"` : ""}): ${document.types.join(", ")}`,
    )
    .join("\n");
}

/**
 * Removes Relume blocks from the Website at `root`: their files and every
 * registration. `slugs` or `all`. Stops, changing nothing, when a document in
 * the dataset uses one of them.
 */
export async function removeBlocks({
  root,
  slugs = [],
  all = false,
  findDocuments = (types) => documentsUsing(root, types),
  steps = defaultSteps,
  log = () => {},
}) {
  const registered = await registeredSlugs(root);
  const chosen = all ? registered : [...new Set(slugs)];
  if (!chosen.length) {
    if (all) return { removed: [], notes: ["No Relume blocks are registered."] };
    throw new ShelfRefusal("Name at least one block, or pass --all.");
  }
  const missing = chosen.filter((slug) => !registered.includes(slug));
  if (missing.length) {
    throw new ShelfRefusal(`Not in this site: ${missing.join(", ")}.`);
  }

  const types = chosen.map((slug) => blockNames(slug).camel);
  log("Checking the dataset for documents that use these blocks...");
  const documents = await findDocuments(types);
  if (documents.length) {
    throw new ShelfRefusal(
      `Nothing was removed: these documents use the blocks, and removing a block that pages use breaks those pages. Remove the blocks from them first.\n${describeDocuments(documents)}`,
    );
  }

  const starter = isStarterCheckout(root);
  return withLock(root, async () => {
    const saved = await snapshot(root, [
      ...registrationFiles,
      libraryDocFile,
      seedModuleFile,
      ...generatedTypeFiles,
      ...(starter ? ["relume/shelf.json"] : []),
      ...chosen.flatMap((slug) => Object.values(blockFilePaths(slug))),
    ]);
    try {
      for (const slug of chosen) await unregister(root, slug);
      if (starter) await writeShelf(root);
      log("Regenerating the Sanity types and running the checks...");
      const notes = await regenerateAndCheck(root, steps);
      return { removed: chosen, notes };
    } catch (error) {
      await restore(saved);
      throw error;
    }
  });
}

// --- Adding ---

// Copies a block's files from the shelf and registers it in every place
// `pnpm relume:convert` does, with the same code.
async function register(root, shelfRoot, record) {
  const { camel } = blockNames(record.slug);
  const text = (role) => readFile(resolve(shelfRoot, record.files[role]), "utf8");
  const options = {
    root,
    dir: "relume",
    fileName: record.slug,
    name: camel,
    scope: "content",
    title: record.name,
    templates: {
      schema: await text("schema"),
      query: await text("query"),
      component: await text("component"),
    },
    ...(record.files.thumbnail
      ? { preview: resolve(shelfRoot, record.files.thumbnail) }
      : {}),
  };
  const plan = await buildPlan(options);
  const libraryWrite = await planLibraryEntry(record.libraryEntry, camel, root);
  const seedWrite = record.seedBlock
    ? await planSeedBlock(record.seedBlock, camel, root)
    : undefined;
  if (record.files.client) {
    // Written before the registrations name it, as the converter does.
    await writeFile(resolve(root, record.files.client), await text("client"), "utf8");
  }
  await applyPlan(plan, options);
  for (const write of [libraryWrite, seedWrite]) {
    if (write) await writeFile(write[0], write[1], "utf8");
  }
}

// --force on a block the site has: its own files become the shelf's, and
// its registrations and seed block stay where they are. A thumbnail that
// comes or goes changes a registration, so that case registers afresh.
async function replaceFiles(root, shelfRoot, record) {
  const own = existingBlockFiles(root, record.slug);
  if (Boolean(own.thumbnail) !== Boolean(record.files.thumbnail)) {
    await unregister(root, record.slug);
    await register(root, shelfRoot, record);
    return;
  }
  for (const [role, file] of Object.entries(blockFilePaths(record.slug))) {
    if (record.files[role]) {
      await copyFile(resolve(shelfRoot, record.files[role]), resolve(root, file));
    } else if (own[role]) {
      await rm(resolve(root, file));
    }
  }
  const { camel } = blockNames(record.slug);
  const libraryDoc = resolve(root, libraryDocFile);
  const pattern = new RegExp(`^- \`${camel}\`(?:\\s|$)`);
  const markdown = await readFile(libraryDoc, "utf8");
  await writeFile(
    libraryDoc,
    markdown
      .split("\n")
      .map((line) => (pattern.test(line) ? record.libraryEntry : line))
      .join("\n"),
    "utf8",
  );
}

async function readPackage(root) {
  return JSON.parse(await readFile(resolve(root, "frontend/package.json"), "utf8"));
}

function sortedObject(object) {
  return Object.fromEntries(Object.entries(object).sort(([a], [b]) => a.localeCompare(b)));
}

/**
 * Adds blocks from the shelf at `shelfRoot` to the Website at `root`.
 * Refuses a block the site has unless `force`, which replaces its files
 * with the shelf's. Any failure, the checks included, restores every file.
 */
export async function addBlocks({
  root,
  shelfRoot,
  slugs,
  force = false,
  steps = defaultSteps,
  log = () => {},
}) {
  const chosen = [...new Set(slugs)];
  if (!chosen.length) throw new ShelfRefusal("Name at least one block to add.");
  const shelf = await readShelf(shelfRoot);
  const records = chosen.map((slug) => {
    const record = shelf.sections.find((block) => block.slug === slug);
    if (!record) throw new ShelfRefusal(`"${slug}" is not on the shelf.`);
    return record;
  });
  const registered = await registeredSlugs(root);
  const present = chosen.filter((slug) => registered.includes(slug));
  if (present.length && !force) {
    throw new ShelfRefusal(
      `Already in this site: ${present.join(", ")}. Add --force to replace their files with the shelf's.`,
    );
  }

  return withLock(root, async () => {
    const saved = await snapshot(root, [
      ...registrationFiles,
      libraryDocFile,
      seedModuleFile,
      "frontend/package.json",
      ...generatedTypeFiles,
      ...records.flatMap((record) => [
        ...Object.values(blockFilePaths(record.slug)),
        ...record.shared,
      ]),
    ]);
    const notes = [];
    try {
      const sharedSeen = new Set();
      for (const record of records) {
        for (const file of record.shared) {
          if (sharedSeen.has(file)) continue;
          sharedSeen.add(file);
          const target = resolve(root, file);
          const source = await readFile(resolve(shelfRoot, file));
          if (!existsSync(target)) {
            await mkdir(dirname(target), { recursive: true });
            await writeFile(target, source);
            notes.push(`Copied the shared file ${file}.`);
          } else if (!(await readFile(target)).equals(source)) {
            notes.push(
              `Left ${file} as it is: this site's copy differs from the Starter's. Compare them if the block misbehaves.`,
            );
          }
        }

        if (present.includes(record.slug)) await replaceFiles(root, shelfRoot, record);
        else await register(root, shelfRoot, record);
      }

      const frontendPackage = await readPackage(root);
      const have = {
        ...frontendPackage.devDependencies,
        ...frontendPackage.dependencies,
      };
      const added = {};
      for (const record of records) {
        for (const [name, version] of Object.entries(record.packages ?? {})) {
          if (!have[name] && !added[name]) added[name] = version;
        }
      }
      if (Object.keys(added).length) {
        frontendPackage.dependencies = sortedObject({
          ...frontendPackage.dependencies,
          ...added,
        });
        await writeFile(
          resolve(root, "frontend/package.json"),
          `${JSON.stringify(frontendPackage, null, 2)}\n`,
          "utf8",
        );
        notes.push(
          `Added to frontend/package.json: ${Object.entries(added)
            .map(([name, version]) => `${name}@${version}`)
            .join(", ")}. Run pnpm install, then pnpm typecheck and pnpm test: the checks were not run because the package is not installed yet.`,
        );
      }

      log("Regenerating the Sanity types and running the checks...");
      notes.push(
        ...(await regenerateAndCheck(root, steps, {
          skipChecks: Object.keys(added).length > 0,
        })),
      );
      return { added: chosen, replaced: present, notes };
    } catch (error) {
      await restore(saved);
      throw error;
    }
  });
}

/**
 * The shelf's blocks, each marked with whether the Website at `root` has
 * it. For the shelf page.
 */
export async function listShelf({ root, shelfRoot }) {
  const shelf = await readShelf(shelfRoot);
  const registered = new Set(await registeredSlugs(root));
  return shelf.sections.map((block) => ({
    ...block,
    inSite: registered.has(block.slug),
  }));
}

/**
 * Site setup: a site fresh from the template has every block on the
 * Starter's shelf registered; this removes them all, so a new Website starts
 * with none. The new site's relume/shelf.json marks it as fresh, and setup
 * deletes that file on its first run whatever it finds, so it empties a site
 * at most once: a later run (after the site has chosen blocks, even all
 * of them) keeps every block. It does nothing in the Starter itself.
 */
export async function startSiteEmpty({ root, ...options }) {
  if (isStarterCheckout(root)) {
    return { removed: [], notes: ["This is the Starter: its Relume blocks stay."] };
  }
  const marker = resolve(root, SHELF_FILE);
  let shelfSlugs;
  try {
    shelfSlugs = (await readShelf(root)).sections.map((block) => block.slug);
  } catch {
    // No shelf manifest: setup has run here before, or this is not a new site.
    shelfSlugs = undefined;
  }
  const registered = await registeredSlugs(root);
  const fresh =
    shelfSlugs !== undefined &&
    registered.length > 0 &&
    shelfSlugs.length === registered.length &&
    shelfSlugs.every((slug) => registered.includes(slug));
  if (!fresh) {
    // The site has started: nothing in it is the template's any more.
    await rm(marker, { force: true });
    return {
      removed: [],
      notes: registered.length
        ? ["Relume blocks were kept: this site has already chosen its own."]
        : [],
    };
  }
  const result = await removeBlocks({ root, all: true, ...options });
  await rm(marker, { force: true });
  return result;
}
