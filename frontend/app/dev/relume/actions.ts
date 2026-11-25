"use server";

import { refresh } from "next/cache";
import {
  findRepoRoot,
  isDecision,
  isDevelopment,
  isSlug,
  writeDecision,
  type Decision,
} from "@/lib/relume-inventory";

export type DecisionResult =
  | { ok: true; slug: string; decision: Decision | null }
  | { ok: false; error: string };

/**
 * Records Want, Skip or Clear (null) for one Relume component in
 * relume/decisions.json. Development only: anywhere else it writes nothing.
 */
export async function setRelumeDecision(
  slug: string,
  decision: Decision | null,
): Promise<DecisionResult> {
  if (!isDevelopment()) {
    return { ok: false, error: "Relume decisions can only be changed under next dev." };
  }
  if (!isSlug(slug)) return { ok: false, error: "Invalid Relume slug." };
  if (decision !== null && !isDecision(decision)) {
    return { ok: false, error: "Invalid decision." };
  }

  writeDecision(findRepoRoot(), slug, decision);
  refresh();
  return { ok: true, slug, decision };
}
