#!/usr/bin/env node
// Captures the Studio insert-menu thumbnail of Relume blocks on the shelf:
// studio/static/images/preview/<type>.jpg, 1200×800, taken from the block's
// Light Block library page on the local Website. Then registers each one in
// page-builder.ts and rewrites relume/shelf.json, so `pnpm relume:add`
// copies the thumbnail with the block and `pnpm relume:remove` takes it away.
//
//   pnpm relume:thumbnails                  # every block on the shelf
//   pnpm relume:thumbnails header83 cta57   # only these
//
// Run it in the Starter with the local servers up (`pnpm dev:worktree`); it
// reads their ports from .worktree-ports.json. A block page that is only a
// draft is captured in draft mode, as `pnpm page:shots` does. See
// docs/agents/relume-import.md, "Shelf".

import { createRequire } from "node:module";
import { existsSync, readFileSync, statSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { blockLibraryBlockSlug } from "../../shared/block-library-names.mjs";
import {
  blockFilePaths,
  blockNames,
  isStarterCheckout,
  readShelf,
  writeShelf,
} from "./lib/shelf-manifest.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export const PAGE_BUILDER_FILE = "studio/schemas/blocks/page-builder.ts";
export const PREVIEW_MARKER = "  // page-builder-generator:preview-types";
/** The thumbnail's size: the Studio grid shows 3:2 tiles. */
export const THUMBNAIL = { width: 1200, height: 800 };
/** The page is drawn at desktop width and scaled down to the thumbnail. */
const VIEWPORT = { width: 1440, height: 960 };
/** Files above this are captured again at a lower JPEG quality. */
export const MAX_BYTES = 150_000;
const QUALITIES = [72, 60, 50, 40];
// Every block is captured with reduced motion, so a scroll-driven block
// draws its still layout (motion-reduce:) instead of the first frame of its
// animation. These blocks' still layout does not fit a thumbnail (Header
// 76's image columns grow to their full height and push the text out of the
// frame), so they are captured as they load, with motion.
export const CAPTURE_WITH_MOTION = new Set(["header76"]);

export function parseArgs(args) {
  const slugs = [];
  for (const arg of args) {
    if (arg.startsWith("-")) throw new Error(`Unexpected option: ${arg}`);
    slugs.push(arg);
  }
  return { slugs };
}

/**
 * page-builder.ts with each type in `types` added to `previewBlockTypes`,
 * in the line format the block generator writes, so unregistering a block
 * removes it again. Types already there are left alone.
 */
export function withPreviewTypes(source, types) {
  if (!source.includes(`${PREVIEW_MARKER}\n`)) {
    throw new Error(`${PAGE_BUILDER_FILE} has no "${PREVIEW_MARKER.trim()}" marker.`);
  }
  const start = source.indexOf("const previewBlockTypes");
  const end = source.indexOf(PREVIEW_MARKER);
  const listed = source.slice(start, end);
  const missing = types.filter((type) => !listed.includes(`  "${type}",\n`));
  if (!missing.length) return source;
  return source.replace(
    `${PREVIEW_MARKER}\n`,
    `${missing.map((type) => `  "${type}",\n`).join("")}${PREVIEW_MARKER}\n`,
  );
}

/** The Light Block library page of a shelf record. */
export function blockPagePath(record) {
  return `/${blockLibraryBlockSlug(record.category, record.name)}`;
}

function localUrls(root) {
  const portsFile = join(root, ".worktree-ports.json");
  const ports = existsSync(portsFile)
    ? JSON.parse(readFileSync(portsFile, "utf8"))
    : { frontendPort: 3000, studioPort: 3333 };
  return {
    frontend: `http://127.0.0.1:${ports.frontendPort}`,
    studio: `http://127.0.0.1:${ports.studioPort}`,
  };
}

// A block page that is still a draft (a block just converted, its page
// seeded but not published) shows only in draft mode. Turns draft mode on in
// the browser the way `pnpm page:shots` does, once, for the rest of the run.
async function enableDraftMode(page, root, { frontend, studio }, path) {
  const { getPageToolsClient } = await import(
    pathToFileURL(join(root, "studio/scripts/lib/page-tools-client.mjs"))
  );
  const frontendRequire = createRequire(join(root, "frontend", "package.json"));
  const nextSanityRequire = createRequire(frontendRequire.resolve("next-sanity/package.json"));
  const { createPreviewSecret } = await import(
    pathToFileURL(nextSanityRequire.resolve("@sanity/preview-url-secret/create-secret"))
  );
  const { secret } = await createPreviewSecret(getPageToolsClient(), "relume-thumbnails", studio);
  await page.goto(
    `${frontend}/api/draft-mode/enable?sanity-preview-secret=${encodeURIComponent(secret)}` +
      `&sanity-preview-pathname=${encodeURIComponent(path)}&sanity-preview-perspective=drafts`,
    { waitUntil: "load", timeout: 120_000 },
  );
}

async function loadChromium(root) {
  // Resolve Playwright the way the frontend does, for pnpm's strict layout.
  const frontendRequire = createRequire(join(root, "frontend", "package.json"));
  const playwrightRequire = createRequire(
    frontendRequire.resolve("@playwright/test/package.json"),
  );
  const playwright = await import(pathToFileURL(playwrightRequire.resolve("playwright")));
  return playwright.chromium ?? playwright.default.chromium;
}

// The block alone: no Block library bar, no dev overlays, no animation. A block shorter than the frame sits in its middle; a
// taller one shows its top.
const PAGE_STYLE =
  "*,*::before,*::after{animation:none!important;transition:none!important}" +
  "[data-block-library-bar],nextjs-portal,sanity-visual-editing{display:none!important}" +
  "html,body{min-height:100vh}body{display:flex;flex-direction:column}" +
  "#main-content{margin-block:auto;width:100%}";

async function capture(page, url, file, { onNotFound } = {}) {
  let response = await page.goto(url, { waitUntil: "load", timeout: 120_000 });
  if (response?.status() === 404 && onNotFound) {
    await onNotFound();
    response = await page.goto(url, { waitUntil: "load", timeout: 120_000 });
  }
  if (!response || response.status() !== 200) {
    throw new Error(`${url} answered ${response?.status() ?? "nothing"}.`);
  }
  await page.addStyleTag({ content: PAGE_STYLE });
  await page.evaluate(() => {
    for (const el of document.querySelectorAll("a,button")) {
      if (/Disable Draft Mode/i.test(el.textContent ?? "")) el.style.display = "none";
    }
  });
  // Reveal animations (animation-timeline: view()) leave blocks at opacity 0
  // when stopped, so show every element outright.
  await page.addStyleTag({ content: "#main-content *{opacity:1!important}" });
  await page.evaluate(async () => {
    for (const img of document.images) img.loading = "eager";
    const pending = [...document.images]
      .filter((img) => !img.complete)
      .map((img) => new Promise((done) => { img.onload = img.onerror = done; }));
    await Promise.race([
      Promise.all(pending),
      new Promise((done) => setTimeout(done, 15_000)),
    ]);
    await document.fonts.ready;
  });
  const height = await page.evaluate(
    () => document.querySelector("#main-content")?.getBoundingClientRect().height ?? 0,
  );
  if (height < 40) throw new Error(`${url} drew no block (main is ${height}px tall).`);
  await page.waitForTimeout(500);

  let bytes;
  for (const quality of QUALITIES) {
    await page.screenshot({ path: file, type: "jpeg", quality });
    bytes = statSync(file).size;
    if (bytes <= MAX_BYTES) break;
  }
  return bytes;
}

async function main() {
  const { slugs } = parseArgs(process.argv.slice(2));
  if (!isStarterCheckout(repoRoot)) {
    throw new Error("Run this in the Starter: a Website gets its thumbnails from the shelf.");
  }
  const shelf = await readShelf(repoRoot);
  const unknown = slugs.filter((slug) => !shelf.sections.some((s) => s.slug === slug));
  if (unknown.length) throw new Error(`Not on the shelf: ${unknown.join(", ")}.`);
  const records = slugs.length
    ? shelf.sections.filter((record) => slugs.includes(record.slug))
    : shelf.sections;

  const urls = localUrls(repoRoot);
  const chromium = await loadChromium(repoRoot);
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: THUMBNAIL.width / VIEWPORT.width,
  });
  const page = await context.newPage();
  const captured = [];
  const failed = [];
  let draftMode = false;
  try {
    for (const record of records) {
      const path = blockPagePath(record);
      const url = `${urls.frontend}${path}`;
      const file = resolve(repoRoot, blockFilePaths(record.slug).thumbnail);
      try {
        await page.emulateMedia({
          reducedMotion: CAPTURE_WITH_MOTION.has(record.slug) ? "no-preference" : "reduce",
        });
        const bytes = await capture(page, url, file, {
          onNotFound: draftMode
            ? undefined
            : async () => {
                console.log("A block page is not published; turning draft mode on.");
                await enableDraftMode(page, repoRoot, urls, path);
                // Only once it is on: a failed attempt is tried again for
                // the next draft page.
                draftMode = true;
              },
        });
        captured.push(blockNames(record.slug).camel);
        console.log(`${record.slug}: ${Math.round(bytes / 1024)} KB  ${url}`);
      } catch (error) {
        failed.push(record.slug);
        console.error(`${record.slug}: ${error.message}`);
      }
    }
  } finally {
    await browser.close();
  }

  const pageBuilder = resolve(repoRoot, PAGE_BUILDER_FILE);
  await writeFile(pageBuilder, withPreviewTypes(await readFile(pageBuilder, "utf8"), captured), "utf8");
  await writeShelf(repoRoot);
  console.log(`Captured ${captured.length} thumbnails; registered them and rewrote relume/shelf.json.`);
  if (failed.length) {
    console.error(`No thumbnail for: ${failed.join(", ")}.`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`relume:thumbnails: ${error.message}`);
    process.exitCode = 1;
  });
}
