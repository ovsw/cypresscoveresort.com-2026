#!/usr/bin/env node
// Prints how many Relume components of each category are not pulled,
// convertible, stopped by the converter, or converted, and writes every
// entry's state to relume/inventory.json. See docs/agents/relume-import.md.

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { formatTable, refreshInventory } from "./lib/inventory.mjs";

async function main() {
  const { components } = await refreshInventory();
  console.log(formatTable(components));
  console.log("\nWrote relume/inventory.json.");
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url))
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
