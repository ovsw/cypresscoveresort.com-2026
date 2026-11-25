#!/usr/bin/env node
// Sets `uncommon` and `layoutStyle` on every entry of relume/catalogue.json
// from saved Relume library MCP `list_components` results.
//
//   pnpm relume:catalogue-fields --all <full-pass files...> --uncommon <uncommon-pass files...>
//
// The MCP needs an OAuth sign-in, so a script cannot call it; an agent saves
// the results and this script files them. See docs/agents/relume-import.md,
// "Catalogue fields".

import { readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  mergeCatalogueFields,
  parseListComponents,
  serializeCatalogue,
} from "./lib/catalogue-fields.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const cataloguePath = resolve(repoRoot, "relume/catalogue.json");

function parseArgs(argv) {
  const files = { all: [], uncommon: [] };
  let current = null;
  for (const arg of argv) {
    if (arg === "--all") current = "all";
    else if (arg === "--uncommon") current = "uncommon";
    else if (current) files[current].push(arg);
    else throw new Error(`Name --all or --uncommon before ${arg}.`);
  }
  if (!files.all.length || !files.uncommon.length) {
    throw new Error(
      "Usage: pnpm relume:catalogue-fields --all <full-pass files...> --uncommon <uncommon-pass files...>",
    );
  }
  return files;
}

async function readPass(paths) {
  const components = [];
  for (const path of paths) {
    try {
      components.push(...parseListComponents(await readFile(path, "utf8")));
    } catch (error) {
      throw new Error(`${path}: ${error instanceof Error ? error.message : error}`);
    }
  }
  return components;
}

async function main() {
  const files = parseArgs(process.argv.slice(2));
  const all = await readPass(files.all);
  const uncommon = await readPass(files.uncommon);
  const catalogue = JSON.parse(await readFile(cataloguePath, "utf8"));
  const { catalogue: merged, differences } = mergeCatalogueFields(catalogue, {
    all,
    uncommon,
  });
  // Written beside the catalogue and renamed over it, so a reader never sees
  // half a file and a failed write leaves the committed catalogue whole.
  const temporary = `${cataloguePath}.${process.pid}.tmp`;
  try {
    await writeFile(temporary, serializeCatalogue(merged), "utf8");
    await rename(temporary, cataloguePath);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
  const uncommonCount = merged.filter((entry) => entry.uncommon).length;
  console.log(
    `Set uncommon and layoutStyle on ${merged.length} entries (${uncommonCount} uncommon).`,
  );
  if (differences.length) {
    console.log(
      `${differences.length} entries differed from the library (tags and preview refreshed; a category is only reported):`,
    );
    for (const { slug, fields } of differences) console.log(`  ${slug}: ${fields.join(", ")}`);
  }
  const { refreshInventoryAfter } = await import("./lib/inventory.mjs");
  await refreshInventoryAfter("pnpm relume:catalogue-fields");
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url))
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
