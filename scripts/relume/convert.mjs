#!/usr/bin/env node
// Converts one Relume component from relume/source/ into a Starter Page
// Builder block and registers it. See docs/agents/relume-import.md.

import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { applyPlan, buildPlan } from "../create-page-builder-block.mjs";
import {
  clientComponentTemplate,
  componentTemplate,
  libraryEntry,
  queryTemplate,
  schemaTemplate,
  seedBlock,
} from "./lib/emit.mjs";
import { analyse, NeedsJudgment } from "./lib/model.mjs";
import { format } from "prettier";
import { renderBlock } from "./lib/render.mjs";

import {
  libraryDocFile,
  blockNames,
  seedModuleFile,
  writeShelf,
} from "./lib/shelf-manifest.mjs";

export { blockNames };

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const seedMarker = "    // relume-seed:blocks";
export const libraryMarker =
  "<!-- relume-blocks: `pnpm relume:convert` adds entries above this line -->";

// Blocks of these categories can open a page: a hero draws the page's
// <h1> when it is the first block, and starts at <h2> anywhere else.
// frontend/components/blocks/hero.ts recognises them by type name.
export const heroCategories = new Set([
  "hero-header-sections",
  "header-sections",
  "blog-post-headers",
  "event-item-headers",
  "portfolio-headers",
  "product-headers",
]);

// Every image in a block of these categories is a logo. On a Dark theme a
// logo is drawn in white (`blockLogoClassName` in block-image.tsx, which the
// hand-finished logo3 shares), since logo artwork is usually dark on a
// transparent ground, and its field help asks for a transparent background.
// Elsewhere an image is a logo by its name or sample (isLogoImage, model.mjs).
export const logoCategories = new Set(["logo-sections"]);

// Left out for now: the Starter owns the header and footer, and forms need a
// submission backend first.
const skippedCategories = new Map([
  [
    "navbars",
    "The Starter builds the Website header from the navigation document.",
  ],
  [
    "footers",
    "The Starter builds the Website footer from the footer document.",
  ],
  [
    "contact-sections",
    "Forms are not imported yet: they need a submission backend.",
  ],
  [
    "contact-modals",
    "Forms are not imported yet: they need a submission backend.",
  ],
  [
    "multi-step-forms",
    "Forms are not imported yet: they need a submission backend.",
  ],
  [
    "banners",
    "Banners are not imported yet: they are site-wide and most hold a form.",
  ],
]);

function usage() {
  return `Convert a Relume component into a Page Builder block.

Usage:
  pnpm relume:convert <slug> [--dry-run] [--print]

  <slug>      A file name in relume/source without ".tsx", such as layout16.
  --dry-run   Report what would be written, and any stop, without writing.
  --print     With --dry-run, also print the three generated files.`;
}

// How many images a block's fields hold, counting a list as many.
function imageCount(fields) {
  let count = 0;
  for (const field of fields) {
    if (field.kind === "image") count += 1;
    else if (field.kind === "imageList") count += 2;
    else if (field.kind === "list" && imageCount(field.item.fields) > 0) {
      count += 2;
    } else if (field.kind === "object") count += imageCount(field.item.fields);
  }
  return count;
}

export function describe(entry, fields) {
  const category = entry.category.replace(/-/g, " ").replace(/s$/, "");
  // A tag that names something the block does not have would mislead an
  // editor: no imported block opens an image in a lightbox, and a block
  // with one image field has no "multiple images" (Header 145).
  const single = fields && imageCount(fields) < 2;
  const shown = entry.tags.filter(
    (tag) =>
      !/lightbox/i.test(tag) && !(single && /^multiple images$/i.test(tag)),
  );
  const tags = shown.length ? `: ${shown.join(", ").toLowerCase()}` : "";
  return `Relume ${category}${tags}.`;
}

// `sourceDir` and `catalogue` (the parsed catalogue) default to the
// repository's own; the inventory passes them so it reads the catalogue once,
// and its tests pass fixtures.
export async function planConversion(
  slug,
  { catalogue, sourceDir = resolve(repoRoot, "relume/source") } = {},
) {
  if (!/^[a-z][a-z0-9]*$/.test(slug)) {
    throw new Error(`"${slug}" is not a Relume source name such as layout16.`);
  }
  const sourcePath = resolve(sourceDir, `${slug}.tsx`);
  if (!existsSync(sourcePath)) {
    throw new Error(
      `relume/source/${slug}.tsx does not exist. Pull it from the Relume library MCP first (docs/agents/relume-import.md).`,
    );
  }
  const entries =
    catalogue ??
    JSON.parse(
      await readFile(resolve(repoRoot, "relume/catalogue.json"), "utf8"),
    );
  const found = entries.find((component) => component.slug === slug);
  if (!found) throw new Error(`"${slug}" is not in relume/catalogue.json.`);
  if (skippedCategories.has(found.category)) {
    throw new NeedsJudgment([skippedCategories.get(found.category)]);
  }
  const model = analyse(await readFile(sourcePath, "utf8"), found);
  const entry = { ...found, description: describe(found, model.fields) };
  const isLogoSection = logoCategories.has(entry.category);
  const rendered = renderBlock(model, {
    isHero: heroCategories.has(entry.category),
    isLogoSection,
  });
  const reasons = [...model.reasons, ...rendered.problems];
  if (reasons.length) throw new NeedsJudgment(reasons);

  const names = blockNames(slug);
  const context = { entry, isLogoSection, model, names, rendered };
  const pretty = (source) => format(source, { parser: "typescript" });
  const client = clientComponentTemplate(context);
  return {
    // A block that runs in the browser has a second renderer file.
    client: client ? await pretty(client) : undefined,
    entry,
    libraryEntry: libraryEntry(context),
    names,
    seedBlock: seedBlock(context),
    templates: {
      schema: await pretty(schemaTemplate(context)),
      query: await pretty(queryTemplate(context)),
      component: await pretty(componentTemplate(context)),
    },
  };
}

function generatorOptions(slug, conversion) {
  return {
    dir: "relume",
    fileName: slug,
    name: conversion.names.camel,
    scope: "content",
    templates: conversion.templates,
    title: conversion.entry.name,
  };
}

/**
 * What `--dry-run` does: plans the files and the registrations and writes
 * nothing. Throws NeedsJudgment with the reasons when the converter stops.
 */
export async function dryRunConversion(slug, paths) {
  const conversion = await planConversion(slug, paths);
  const options = generatorOptions(slug, conversion);
  return { conversion, options, plan: await buildPlan(options) };
}

// Both return the write to make, or nothing when the entry is already
// there. They throw before anything is written, so a missing marker cannot
// leave a half-registered block behind. `pnpm relume:add` uses both with
// the Website's root.
export async function planLibraryEntry(line, camel, root = repoRoot) {
  const libraryDoc = resolve(root, libraryDocFile);
  const markdown = await readFile(libraryDoc, "utf8");
  if (markdown.includes(`- \`${camel}\``)) return undefined;
  if (markdown.split(libraryMarker).length !== 2) {
    throw new Error(
      `docs/content-model.md must contain exactly one line:\n${libraryMarker}`,
    );
  }
  return [
    libraryDoc,
    markdown.replace(libraryMarker, `${line}\n${libraryMarker}`),
  ];
}

export async function planSeedBlock(block, camel, root = repoRoot) {
  const seedModule = resolve(root, seedModuleFile);
  const source = await readFile(seedModule, "utf8");
  if (source.includes(`_type: "${camel}"`)) return undefined;
  if (source.split(seedMarker).length !== 2) {
    throw new Error(
      `${seedModule} must contain exactly one "${seedMarker.trim()}" marker`,
    );
  }
  return [
    seedModule,
    await format(source.replace(seedMarker, `${block}\n${seedMarker}`), {
      parser: "babel",
    }),
  ];
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || !args.length) {
    console.log(usage());
    return;
  }
  const dryRun = args.includes("--dry-run");
  const print = args.includes("--print");
  const slug = args.find((argument) => !argument.startsWith("--"));

  const clientTarget = resolve(
    repoRoot,
    `frontend/components/blocks/relume/${slug}.client.tsx`,
  );
  if (dryRun) {
    const { conversion, plan } = await dryRunConversion(slug);
    console.log(`Would create and register ${conversion.names.camel}:`);
    for (const key of ["schema", "query", "component"]) {
      console.log(`- ${plan.targets[key]}`);
      if (print) console.log(`\n${plan.templates[key]}`);
    }
    if (conversion.client) {
      console.log(`- ${clientTarget}`);
      if (print) console.log(`\n${conversion.client}`);
    }
    console.log(`Block library entry:\n${conversion.libraryEntry}`);
    return;
  }

  const conversion = await planConversion(slug);
  const options = generatorOptions(slug, conversion);
  const lockPath = resolve(repoRoot, ".page-builder-generator.lock");
  try {
    await mkdir(lockPath);
  } catch (error) {
    if (error.code === "EEXIST") {
      throw new Error(
        "Another generator run holds .page-builder-generator.lock. If it crashed, remove that empty directory before retrying.",
      );
    }
    throw error;
  }
  try {
    const plan = await buildPlan(options);
    const writes = [
      await planLibraryEntry(conversion.libraryEntry, conversion.names.camel),
      await planSeedBlock(conversion.seedBlock, conversion.names.camel),
    ];
    if (conversion.client) {
      if (existsSync(clientTarget)) {
        throw new Error(`${clientTarget} already exists.`);
      }
      // Written before the registrations name it, and removed again if they
      // fail, so a run never leaves a renderer that imports a missing file.
      await writeFile(clientTarget, conversion.client, "utf8");
    }
    try {
      await applyPlan(plan, options);
    } catch (error) {
      // applyPlan keeps the renderer when another writer changed a
      // registration; the client file must then stay with it.
      if (conversion.client && !existsSync(plan.targets.component)) {
        await rm(clientTarget, { force: true });
      }
      throw error;
    }
    for (const write of writes) {
      if (write) await writeFile(write[0], write[1], "utf8");
    }
    // The shelf lists every registered block; see "Shelf" in the guide.
    await writeShelf(repoRoot);
    console.log(`Created and registered ${conversion.names.camel}.`);
    for (const key of ["schema", "query", "component"]) {
      console.log(`- ${plan.targets[key]}`);
    }
    if (conversion.client) console.log(`- ${clientTarget}`);
    console.log(
      "Next: run pnpm typegen, then the checks in docs/agents/relume-import.md.",
    );
  } finally {
    await rm(lockPath, { recursive: true });
  }
  const { refreshInventoryAfter } = await import("./lib/inventory.mjs");
  await refreshInventoryAfter("pnpm relume:convert");
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url))
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = error instanceof NeedsJudgment ? 2 : 1;
  });
