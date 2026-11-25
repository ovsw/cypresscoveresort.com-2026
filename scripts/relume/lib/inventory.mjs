// The state of every Relume catalogue entry in this repository: pulled or
// not, converted or not, and whether the converter can take it. Written to
// relume/inventory.json for the local browse page (/dev/relume). See
// docs/agents/relume-import.md, "Inventory".

import { existsSync } from "node:fs";
import { readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { dryRunConversion } from "../convert.mjs";
import { NeedsJudgment } from "./model.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

export const statuses = [
  "not-pulled",
  "convertible",
  "needs-judgment",
  "converted",
];
export const decisionValues = ["want", "skip"];

export const defaultPaths = {
  catalogue: resolve(repoRoot, "relume/catalogue.json"),
  sourceDir: resolve(repoRoot, "relume/source"),
  schemaDir: resolve(repoRoot, "studio/schemas/blocks/relume"),
  decisions: resolve(repoRoot, "relume/decisions.json"),
  inventory: resolve(repoRoot, "relume/inventory.json"),
};

/**
 * Reads relume/decisions.json, `{ "<slug>": "want" | "skip" }`. A missing
 * file means nothing is decided yet.
 */
export async function readDecisions(path = defaultPaths.decisions) {
  let text;
  try {
    text = await readFile(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
  const decisions = JSON.parse(text);
  if (!decisions || typeof decisions !== "object" || Array.isArray(decisions)) {
    throw new Error(`${path} must hold an object of slug: "want" | "skip".`);
  }
  for (const [slug, decision] of Object.entries(decisions)) {
    if (!decisionValues.includes(decision)) {
      throw new Error(
        `${path}: "${slug}" is ${JSON.stringify(decision)}; a decision is "want" or "skip".`,
      );
    }
  }
  return decisions;
}

/**
 * One entry's status and, for `needs-judgment`, the converter's reasons.
 * `paths.catalogue` is the parsed catalogue the converter looks the entry up
 * in.
 */
export async function componentStatus(entry, paths) {
  const { catalogue, sourceDir, schemaDir } = paths;
  if (existsSync(resolve(schemaDir, `${entry.slug}.ts`))) {
    return { status: "converted", reasons: [] };
  }
  if (!existsSync(resolve(sourceDir, `${entry.slug}.tsx`))) {
    return { status: "not-pulled", reasons: [] };
  }
  try {
    await dryRunConversion(entry.slug, { catalogue, sourceDir });
    return { status: "convertible", reasons: [] };
  } catch (error) {
    // A deliberate stop keeps its reasons; anything else the converter throws
    // on this source is a reason too, so one odd file cannot stop the rest.
    if (error instanceof NeedsJudgment) {
      return { status: "needs-judgment", reasons: error.reasons };
    }
    return {
      status: "needs-judgment",
      reasons: [error instanceof Error ? error.message : String(error)],
    };
  }
}

/** Every catalogue entry, in catalogue order, with its status and decision. */
export async function buildInventory(paths = {}) {
  const resolved = { ...defaultPaths, ...paths };
  const catalogue = JSON.parse(await readFile(resolved.catalogue, "utf8"));
  const decisions = await readDecisions(resolved.decisions);
  const components = [];
  for (const entry of catalogue) {
    const { status, reasons } = await componentStatus(entry, {
      catalogue,
      sourceDir: resolved.sourceDir,
      schemaDir: resolved.schemaDir,
    });
    components.push({
      slug: entry.slug,
      name: entry.name,
      category: entry.category,
      tags: entry.tags,
      preview: entry.preview,
      // From the Relume library MCP; see "Catalogue fields" in
      // docs/agents/relume-import.md. An entry without them reads as common
      // with no layout style.
      uncommon: entry.uncommon === true,
      layoutStyle: Array.isArray(entry.layoutStyle) ? entry.layoutStyle : [],
      status,
      reasons,
      decision: decisions[entry.slug] ?? null,
    });
  }
  return { generatedAt: new Date().toISOString(), components };
}

export async function writeInventory(inventory, path = defaultPaths.inventory) {
  // Written whole and then moved into place, so the page never reads half a
  // file.
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(inventory, null, 2)}\n`, "utf8");
  await rename(temporary, path);
}

export async function refreshInventory(paths = {}) {
  const inventory = await buildInventory(paths);
  await writeInventory(inventory, paths.inventory ?? defaultPaths.inventory);
  return inventory;
}

// Keeps relume/inventory.json in step after a command changed what is pulled
// or converted. The command's own work is done by then, so a failure here is
// a warning.
export async function refreshInventoryAfter(command) {
  try {
    await refreshInventory();
    console.log("Refreshed relume/inventory.json.");
  } catch (error) {
    console.warn(
      `${command} finished, but relume/inventory.json was not refreshed: ${error instanceof Error ? error.message : error}\nRun pnpm relume:inventory.`,
    );
  }
}

/** Counts per category, largest category first, then a totals row. */
export function summarise(components) {
  const empty = () => Object.fromEntries(statuses.map((status) => [status, 0]));
  const byCategory = new Map();
  const totals = empty();
  for (const { category, status } of components) {
    if (!byCategory.has(category)) byCategory.set(category, empty());
    byCategory.get(category)[status] += 1;
    totals[status] += 1;
  }
  const sum = (counts) => statuses.reduce((total, s) => total + counts[s], 0);
  const rows = [...byCategory]
    .map(([category, counts]) => ({ category, ...counts, total: sum(counts) }))
    .sort((a, b) => b.total - a.total || a.category.localeCompare(b.category));
  return { rows, totals: { category: "Total", ...totals, total: sum(totals) } };
}

export function formatTable(components) {
  const { rows, totals } = summarise(components);
  const columns = [
    ["category", "Category"],
    ["not-pulled", "Not pulled"],
    ["convertible", "Convertible"],
    ["needs-judgment", "Needs judgment"],
    ["converted", "Converted"],
    ["total", "Total"],
  ];
  const table = [Object.fromEntries(columns), ...rows, totals].map((row) =>
    columns.map(([key]) => String(row[key])),
  );
  const widths = columns.map((_, index) =>
    Math.max(...table.map((cells) => cells[index].length)),
  );
  const line = (cells) =>
    cells
      .map((cell, index) =>
        index === 0 ? cell.padEnd(widths[index]) : cell.padStart(widths[index]),
      )
      .join("  ");
  const rule = widths.map((width) => "-".repeat(width)).join("  ");
  return [
    line(table[0]),
    rule,
    ...table.slice(1, -1).map(line),
    rule,
    line(table.at(-1)),
  ].join("\n");
}
