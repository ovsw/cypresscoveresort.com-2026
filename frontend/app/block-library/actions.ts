"use server";

import { refresh } from "next/cache";
import { findRepoRoot, isDevelopment, isSlug } from "@/lib/relume-inventory";
import { runShelfCommand, type ShelfCommandResult } from "@/lib/relume-shelf";

/**
 * Runs `pnpm relume:add <slug>` or `pnpm relume:remove <slug>` and returns
 * its output. Development only: anywhere else it changes nothing.
 */
export async function changeShelfBlock(
  command: "add" | "remove",
  slug: string,
): Promise<ShelfCommandResult> {
  if (!isDevelopment()) {
    return { ok: false, output: "Blocks can only be added or removed under next dev." };
  }
  if (command !== "add" && command !== "remove") {
    return { ok: false, output: "Unknown command." };
  }
  if (!isSlug(slug)) return { ok: false, output: "Invalid Relume slug." };

  const result = await runShelfCommand(findRepoRoot(), command, slug);
  refresh();
  return result;
}
