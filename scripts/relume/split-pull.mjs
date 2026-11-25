#!/usr/bin/env node
// Splits the text a Relume library MCP `get_components` call returns into one
// untouched source file per component under `relume/source/`.
//
// The MCP needs an OAuth sign-in, so a script cannot call it. An agent calls
// `get_components` with up to 20 slugs; the harness saves a result that large
// to a text file, and this script files it. See docs/agents/relume-import.md.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const sourceRoot = resolve(repoRoot, "relume/source");

/**
 * Reads every `// File: <path>` + fenced code pair. A Relume component's
 * heading line (`### Layout 16  (slug: layout16)`) sits directly above its
 * file line;
 * primitives have no heading.
 */
export function parsePull(text) {
  const lines = text.split("\n");
  const files = [];
  for (let index = 0; index < lines.length; index += 1) {
    const fileLine = /^\/\/ File: (\S+)\s*$/.exec(lines[index]);
    if (!fileLine || !/^```/.test(lines[index + 1] ?? "")) continue;
    const heading = /^### (.+?)\s+\(slug: ([a-z0-9_-]+)\)\s*$/.exec(
      lines[index - 1] ?? "",
    );
    let end = index + 2;
    while (end < lines.length && lines[end] !== "```") end += 1;
    if (end === lines.length) {
      throw new Error(`Unclosed code block for ${fileLine[1]}`);
    }
    files.push({
      path: fileLine[1],
      name: heading?.[1],
      // The MCP's own slugs are irregular ("layout16", "grid-list3_component",
      // "cookie1" for "Cookie Consent 1"). The catalogue slug is the display
      // name in lower case without spaces or punctuation.
      slug: heading ? catalogueSlug(heading[1]) : undefined,
      source: `${lines.slice(index + 2, end).join("\n")}\n`,
    });
    index = end;
  }
  return files;
}

export function catalogueSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function targetPath({ path, slug }) {
  return slug
    ? resolve(sourceRoot, `${slug}.tsx`)
    : resolve(sourceRoot, "primitives", path);
}

async function main() {
  const pulls = process.argv.slice(2);
  if (!pulls.length) {
    console.error("Usage: pnpm relume:split-pull <pull-file>...");
    process.exitCode = 1;
    return;
  }
  let components = 0;
  let primitives = 0;
  for (const pull of pulls) {
    const files = parsePull(
      await readFile(resolve(process.cwd(), pull), "utf8"),
    );
    if (!files.length) throw new Error(`No component files found in ${pull}`);
    for (const file of files) {
      const target = targetPath(file);
      if (!target.startsWith(`${sourceRoot}/`)) {
        throw new Error(
          `Refusing to write outside relume/source: ${file.path}`,
        );
      }
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, file.source, "utf8");
      if (file.slug) components += 1;
      else primitives += 1;
    }
  }
  console.log(
    `Filed ${components} Relume component source(s) and ${primitives} primitive file(s) under relume/source.`,
  );
  const { refreshInventoryAfter } = await import("./lib/inventory.mjs");
  await refreshInventoryAfter("pnpm relume:split-pull");
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url))
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
