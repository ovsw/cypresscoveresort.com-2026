"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Decision } from "@/lib/relume-inventory";
import { setRelumeDecision } from "../actions";

const DECISION_STYLES: Record<Decision, string> = {
  want: "border-emerald-300 bg-emerald-50 text-emerald-800",
  skip: "border-zinc-300 bg-zinc-100 text-zinc-600",
};

export function DecisionControl({
  slug,
  decision,
}: {
  slug: string;
  decision: Decision | null;
}) {
  const [pending, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(decision);

  function choose(next: Decision | null) {
    startTransition(async () => {
      setShown(next);
      try {
        const result = await setRelumeDecision(slug, next);
        if (!result.ok) toast.error(result.error);
      } catch {
        // A rejection can come after the file was written, so this does not
        // claim nothing was saved. The buttons stay usable for a retry.
        toast.error("Saving the decision failed. Reload to see what was saved.");
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-2" aria-busy={pending}>
      <span
        className={cn(
          "rounded border px-2 py-0.5 text-xs font-medium",
          shown ? DECISION_STYLES[shown] : "border-dashed border-zinc-300 text-zinc-500",
        )}
        data-decision={shown ?? "undecided"}
      >
        {shown === "want" ? "Want" : shown === "skip" ? "Skip" : "Undecided"}
      </span>
      <div className="flex gap-1">
        <Button
          type="button"
          size="sm"
          variant={shown === "want" ? "default" : "outline"}
          aria-pressed={shown === "want"}
          disabled={pending}
          onClick={() => choose("want")}
        >
          Want
        </Button>
        <Button
          type="button"
          size="sm"
          variant={shown === "skip" ? "secondary" : "outline"}
          aria-pressed={shown === "skip"}
          disabled={pending}
          onClick={() => choose("skip")}
        >
          Skip
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={pending || shown === null}
          onClick={() => choose(null)}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
