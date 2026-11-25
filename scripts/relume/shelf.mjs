#!/usr/bin/env node
// The Relume shelf commands: add blocks from the Starter's shelf to this
// Website, remove them, and rewrite the Starter's shelf manifest. See
// docs/agents/relume-import.md, "Shelf".

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  addBlocks,
  listShelf,
  removeBlocks,
  ShelfRefusal,
  withShelfRoot,
} from "./lib/shelf.mjs";
import { isStarterCheckout, writeShelf } from "./lib/shelf-manifest.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const usages = {
  add: `Add Relume blocks from the Starter's shelf to this site.

Usage:
  pnpm relume:add <slug>... [--force] [--from <path>]

  <slug>         A block on the shelf, such as layout16.
  --force        Replace the files of a block the site already has with the shelf's.
  --from <path>  Read the shelf from a local Starter checkout instead of GitHub.`,
  remove: `Remove Relume blocks from this site.

Usage:
  pnpm relume:remove <slug>... | --all

  <slug>   A block in this site, such as layout16.
  --all    Every Relume block in this site.

Stops, removing nothing, when a document in the site's dataset uses one.`,
  write: `Rewrite relume/shelf.json from the blocks registered in the Starter.

Usage:
  pnpm relume:shelf`,
};

function parse(argv) {
  const [command, ...rest] = argv;
  const options = { command, slugs: [], force: false, all: false, json: false };
  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index];
    if (argument === "--force") options.force = true;
    else if (argument === "--all") options.all = true;
    else if (argument === "--json") options.json = true;
    else if (argument === "--help") options.help = true;
    else if (argument === "--from") {
      options.from = rest[index + 1];
      index += 1;
      if (!options.from) throw new ShelfRefusal("--from needs a path.");
    } else if (argument.startsWith("--")) {
      throw new ShelfRefusal(`Unknown option ${argument}.`);
    } else options.slugs.push(argument);
  }
  return options;
}

const log = (message) => console.log(message);

function report(lines) {
  for (const line of lines) console.log(line);
}

async function main() {
  const options = parse(process.argv.slice(2));
  if (options.help || !usages[options.command] && options.command !== "list") {
    console.log(usages[options.command] ?? Object.values(usages).join("\n\n"));
    return;
  }

  if (options.command === "write") {
    const shelf = await writeShelf(repoRoot);
    console.log(`Wrote relume/shelf.json: ${shelf.sections.length} blocks.`);
    return;
  }

  if (options.command === "list") {
    // For the shelf page: JSON on stdout.
    const starter = isStarterCheckout(repoRoot);
    let shelfRoot;
    const blocks = await withShelfRoot(repoRoot, { ...options, refresh: false }, (root) => {
      shelfRoot = root;
      return listShelf({ root: repoRoot, shelfRoot });
    });
    console.log(
      JSON.stringify({
        source: options.from ? shelfRoot : starter ? "this Starter" : "GitHub",
        sections: blocks,
      }),
    );
    return;
  }

  if (options.command === "add") {
    if (!options.slugs.length) throw new ShelfRefusal(usages.add);
    log(options.from ? `Reading the shelf from ${options.from}.` : "Getting the shelf...");
    const result = await withShelfRoot(repoRoot, options, (shelfRoot) =>
      addBlocks({
        root: repoRoot,
        shelfRoot,
        slugs: options.slugs,
        force: options.force,
        log,
      }),
    );
    const fresh = result.added.filter((slug) => !result.replaced.includes(slug));
    if (fresh.length) console.log(`Added ${fresh.join(", ")}.`);
    if (result.replaced.length)
      console.log(`Replaced the files of ${result.replaced.join(", ")} with the shelf's.`);
    report(result.notes);
    return;
  }

  if (options.command === "remove") {
    if (!options.slugs.length && !options.all) throw new ShelfRefusal(usages.remove);
    const result = await removeBlocks({
      root: repoRoot,
      slugs: options.slugs,
      all: options.all,
      log,
    });
    if (result.removed.length) console.log(`Removed ${result.removed.join(", ")}.`);
    report(result.notes);
  }
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url))
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    if (!(error instanceof ShelfRefusal)) console.error("Nothing was changed.");
    process.exitCode = error instanceof ShelfRefusal ? 2 : 1;
  });
