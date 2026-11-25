// The shelf manifest, relume/shelf.json: one record per Relume block the
// Starter has converted and registered, with the files that make it up, the
// shared files and npm packages it needs, and its Block library entry.
// `pnpm relume:add` reads it to copy a block into a Website. See
// docs/agents/relume-import.md, "Shelf".

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";

/** The Starter repository `pnpm relume:add` gets the shelf from. */
export const STARTER_REPOSITORY =
  "https://github.com/ovsw/next-sanity-starter.git";

export const SHELF_FILE = "relume/shelf.json";

export const registrationFiles = [
  "studio/schemas/blocks/page-builder.ts",
  "studio/schema-types.ts",
  "frontend/sanity/queries/page-builder.ts",
  "frontend/components/blocks/index.tsx",
];

export const libraryDocFile = "docs/content-model.md";
export const seedModuleFile = "studio/scripts/seed-relume-blocks.mjs";

export function blockNames(slug) {
  const pascal = `Relume${slug[0].toUpperCase()}${slug.slice(1)}`;
  return {
    camel: `relume${slug[0].toUpperCase()}${slug.slice(1)}`,
    kebab: `relume-${slug}`,
    pascal,
  };
}

/** A block's own files, by role, relative to the repository root. */
export function blockFilePaths(slug) {
  return {
    schema: `studio/schemas/blocks/relume/${slug}.ts`,
    query: `frontend/sanity/queries/relume/${slug}.ts`,
    component: `frontend/components/blocks/relume/${slug}.tsx`,
    client: `frontend/components/blocks/relume/${slug}.client.tsx`,
    thumbnail: `studio/static/images/preview/${blockNames(slug).camel}.jpg`,
  };
}

/** The block's files that exist under `root`, by role. */
export function existingBlockFiles(root, slug) {
  return Object.fromEntries(
    Object.entries(blockFilePaths(slug)).filter(([, file]) =>
      existsSync(resolve(root, file)),
    ),
  );
}

/**
 * The Relume blocks registered under `root`, in registration order: those
 * Studio's schema-types.ts imports from schemas/blocks/relume/.
 */
export async function registeredSlugs(root) {
  const source = await readFile(resolve(root, "studio/schema-types.ts"), "utf8");
  return [
    ...source.matchAll(
      /^import (relume\w+) from "\.\/schemas\/blocks\/relume\/([a-z][a-z0-9]*)";$/gm,
    ),
  ]
    .filter(([, camel, slug]) => blockNames(slug).camel === camel)
    .map(([, , slug]) => slug);
}

/**
 * True when `root` is a checkout of the Starter itself, judged by its git
 * origin. A Website made from the Starter has its own repository.
 */
export function isStarterCheckout(root) {
  let url;
  try {
    url = execFileSync("git", ["-C", root, "remote", "get-url", "origin"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return false;
  }
  return /github\.com[:/]ovsw\/next-sanity-starter(?:\.git)?$/.test(url);
}

// --- Import graph: which local files and packages a block depends on ---

const sourceExtensions = [".ts", ".tsx", ".mjs", ".js"];
const skippedDirectories = new Set([
  "node_modules",
  ".next",
  ".sanity",
  "dist",
  "out",
  "test-results",
  "playwright-report",
]);

function walk(root, directory, files = []) {
  const full = resolve(root, directory);
  if (!existsSync(full)) return files;
  for (const entry of readdirSync(full, { withFileTypes: true })) {
    if (entry.name.startsWith(".") && entry.isDirectory()) continue;
    if (skippedDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(root, path, files);
    else if (sourceExtensions.some((extension) => entry.name.endsWith(extension)))
      files.push(path.split(sep).join("/"));
  }
  return files;
}

const importPattern =
  /(?:import|export)\s[^'"`;]*?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|^\s*import\s+["']([^"']+)["']/gm;

function specifiers(source) {
  return [...source.matchAll(importPattern)].map(
    (match) => match[1] ?? match[2] ?? match[3],
  );
}

function packageName(specifier) {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

function resolveLocal(root, from, specifier) {
  let base;
  if (specifier.startsWith("@/")) {
    const workspace = from.split("/")[0];
    base = resolve(root, workspace, specifier.slice(2));
  } else if (specifier.startsWith(".")) {
    base = resolve(root, dirname(from), specifier);
  } else {
    return undefined;
  }
  for (const candidate of [
    base,
    ...sourceExtensions.map((extension) => `${base}${extension}`),
    ...sourceExtensions.map((extension) => join(base, `index${extension}`)),
  ]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return relative(root, candidate).split(sep).join("/");
    }
  }
  return undefined;
}

/** Every source file's local imports and package imports. */
export function importGraph(root) {
  const graph = new Map();
  for (const file of ["frontend", "studio", "shared"].flatMap((directory) =>
    walk(root, directory),
  )) {
    const local = new Set();
    const packages = new Set();
    for (const specifier of specifiers(readFileSync(resolve(root, file), "utf8"))) {
      if (specifier.startsWith("node:")) continue;
      const target = resolveLocal(root, file, specifier);
      if (target) local.add(target);
      else if (!specifier.startsWith(".") && !specifier.startsWith("@/"))
        packages.add(packageName(specifier));
    }
    graph.set(file, { local, packages });
  }
  return graph;
}

function closure(graph, starts, stop = new Set()) {
  const seen = new Set();
  const queue = [...starts];
  while (queue.length) {
    const file = queue.pop();
    if (seen.has(file) || stop.has(file) || !graph.has(file)) continue;
    seen.add(file);
    queue.push(...graph.get(file).local);
  }
  return seen;
}

const isTest = (file) => /\.test\.[cm]?[jt]sx?$/.test(file);
const generated = new Set(["frontend/sanity.types.ts"]);

/**
 * Splits what the blocks import into what the rest of the Starter also uses
 * (the base) and what only Relume blocks use (the shelf's shared files and
 * packages). A file the base reaches is base; the registration files, which
 * import every block, and tests do not count as the base.
 */
export function relumeDependencies(root, slugs) {
  const graph = importGraph(root);
  const own = new Set(
    slugs.flatMap((slug) => Object.values(existingBlockFiles(root, slug))),
  );
  const reachedByBlocks = closure(graph, own);
  const others = [...graph.keys()].filter(
    (file) =>
      !reachedByBlocks.has(file) &&
      !registrationFiles.includes(file) &&
      !isTest(file),
  );
  // The base stops at the registration files and the blocks: the page
  // routes reach every block through blocks/index.tsx.
  const base = closure(graph, others, new Set([...registrationFiles, ...own]));
  const basePackages = new Set(
    [...base, ...registrationFiles].flatMap((file) => [
      ...(graph.get(file)?.packages ?? []),
    ]),
  );
  const isShared = (file) =>
    !own.has(file) && !base.has(file) && !generated.has(file);

  return (slug) => {
    const files = Object.values(existingBlockFiles(root, slug));
    const reached = closure(graph, files);
    const shared = [...reached].filter(isShared).sort();
    // Packages the block's own files and its shared files import. A
    // thumbnail is not code, so the import graph has no entry for it.
    const packages = [
      ...new Set(
        [...files, ...shared].flatMap((file) => [
          ...(graph.get(file)?.packages ?? []),
        ]),
      ),
    ]
      .filter((name) => !basePackages.has(name))
      .sort();
    return { shared, packages };
  };
}

// --- The manifest ---

/**
 * Where a block's sample sits in the seed module's lines, as
 * [start, end] inclusive, or undefined. The blocks are Prettier-formatted
 * objects opening with "    {" and closing with "    },".
 */
export function seedBlockRange(lines, camel) {
  const typeLine = lines.indexOf(`      _type: "${camel}",`);
  if (typeLine === -1) return undefined;
  let start = typeLine;
  while (start > 0 && lines[start] !== "    {") start -= 1;
  let end = typeLine;
  while (end < lines.length && lines[end] !== "    },") end += 1;
  if (lines[start] !== "    {" || end === lines.length) {
    throw new Error(`Could not find the ${camel} block in ${seedModuleFile}.`);
  }
  return [start, end];
}

function seedBlockText(source, camel) {
  const lines = source.split("\n");
  const range = seedBlockRange(lines, camel);
  if (!range) throw new Error(`${seedModuleFile} has no sample block for ${camel}.`);
  return lines.slice(range[0], range[1] + 1).join("\n");
}

function libraryEntryLine(markdown, camel) {
  const line = markdown
    .split("\n")
    .find((candidate) => new RegExp(`^- \`${camel}\`(?:\\s|$)`).test(candidate));
  if (!line) {
    throw new Error(
      `${libraryDocFile} has no Block library entry for ${camel}.`,
    );
  }
  return line;
}

/** The manifest for the blocks registered under `root`. */
export async function buildShelf(root) {
  const slugs = await registeredSlugs(root);
  const catalogue = JSON.parse(
    await readFile(resolve(root, "relume/catalogue.json"), "utf8"),
  );
  const markdown = await readFile(resolve(root, libraryDocFile), "utf8");
  const seedSource = await readFile(resolve(root, seedModuleFile), "utf8");
  const frontendPackage = JSON.parse(
    await readFile(resolve(root, "frontend/package.json"), "utf8"),
  );
  const versions = {
    ...frontendPackage.devDependencies,
    ...frontendPackage.dependencies,
  };
  const dependencies = relumeDependencies(root, slugs);

  const blocks = slugs.map((slug) => {
    const entry = catalogue.find((component) => component.slug === slug);
    if (!entry) throw new Error(`"${slug}" is not in relume/catalogue.json.`);
    const { camel } = blockNames(slug);
    const files = existingBlockFiles(root, slug);
    for (const role of ["schema", "query", "component"]) {
      if (!files[role]) {
        throw new Error(`${slug} is registered but ${blockFilePaths(slug)[role]} is missing.`);
      }
    }
    const { shared, packages } = dependencies(slug);
    return {
      slug,
      type: camel,
      name: entry.name,
      category: entry.category,
      tags: entry.tags,
      preview: entry.preview,
      uncommon: entry.uncommon === true,
      layoutStyle: Array.isArray(entry.layoutStyle) ? entry.layoutStyle : [],
      files,
      shared,
      packages: Object.fromEntries(
        packages.map((name) => {
          if (!versions[name]) {
            throw new Error(
              `${slug} imports ${name}, which frontend/package.json does not list.`,
            );
          }
          return [name, versions[name]];
        }),
      ),
      libraryEntry: libraryEntryLine(markdown, camel),
      // Its sample block, which the seed shows on its own Block library pages.
      seedBlock: seedBlockText(seedSource, camel),
    };
  });
  // The key stays "sections": Websites already built read this file from the
  // Starter with their own copy of `relume:add`.
  return { sections: blocks };
}

export function serializeShelf(shelf) {
  return `${JSON.stringify(shelf, null, 2)}\n`;
}

export async function writeShelf(root) {
  const shelf = await buildShelf(root);
  await writeFile(resolve(root, SHELF_FILE), serializeShelf(shelf), "utf8");
  return shelf;
}

export async function readShelf(root) {
  const path = resolve(root, SHELF_FILE);
  if (!existsSync(path)) {
    throw new Error(`${path} does not exist: that folder is not a Starter with a shelf.`);
  }
  const shelf = JSON.parse(await readFile(path, "utf8"));
  if (!Array.isArray(shelf?.sections)) {
    throw new Error(`${path} has no "sections" list.`);
  }
  return shelf;
}
