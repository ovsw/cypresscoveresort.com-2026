/**
 * Under `next dev`, the Block library index (/block-library) reads and
 * changes the shelf by running the same command the terminal runs,
 * `scripts/relume/shelf.mjs`, so the page and `pnpm relume:add` /
 * `pnpm relume:remove` cannot disagree. See docs/agents/relume-import.md,
 * "Shelf".
 */
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import type { InventoryRecord } from "@/lib/relume-inventory";

const run = promisify(execFile);

export type ShelfBlock = {
  slug: string;
  type: string;
  name: string;
  category: string;
  tags: string[];
  preview: string;
  uncommon: boolean;
  layoutStyle: string[];
  inSite: boolean;
};

export type ShelfResult =
  | { state: "ok"; source: string; blocks: ShelfBlock[] }
  | { state: "error"; error: string };

export type ShelfCommandResult = { ok: boolean; output: string };

function shelfScript(root: string) {
  return path.join(root, "scripts", "relume", "shelf.mjs");
}

function outputOf(error: unknown) {
  const { stdout = "", stderr = "", message } = error as {
    stdout?: string;
    stderr?: string;
    message?: string;
  };
  return `${stdout}${stderr}`.trim() || message || String(error);
}

/** The shelf's blocks, each marked with whether this site has it. */
export async function loadShelf(root: string): Promise<ShelfResult> {
  try {
    const { stdout } = await run(process.execPath, [shelfScript(root), "list"], {
      cwd: root,
      maxBuffer: 16 * 1024 * 1024,
    });
    const parsed = JSON.parse(stdout) as { source: string; sections: ShelfBlock[] };
    return { state: "ok", source: parsed.source, blocks: parsed.sections };
  } catch (error) {
    return { state: "error", error: outputOf(error) };
  }
}

/**
 * Runs `add` or `remove` for one block and returns what the command
 * printed, a refusal and its reason included.
 */
export async function runShelfCommand(
  root: string,
  command: "add" | "remove",
  slug: string,
): Promise<ShelfCommandResult> {
  try {
    const { stdout, stderr } = await run(
      process.execPath,
      [shelfScript(root), command, slug],
      { cwd: root, maxBuffer: 16 * 1024 * 1024, env: { ...process.env, FORCE_COLOR: "0" } },
    );
    return { ok: true, output: `${stdout}${stderr}`.trim() };
  } catch (error) {
    return { ok: false, output: outputOf(error) };
  }
}

/** A shelf block in the shape the inventory filters read. */
export function asFilterRecord(block: ShelfBlock): InventoryRecord {
  return {
    slug: block.slug,
    name: block.name,
    category: block.category,
    tags: block.tags,
    preview: block.preview,
    uncommon: block.uncommon,
    layoutStyle: block.layoutStyle,
    status: "converted",
    reasons: [],
    decision: null,
  };
}
