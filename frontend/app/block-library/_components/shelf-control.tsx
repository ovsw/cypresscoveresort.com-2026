"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ShelfCommandResult } from "@/lib/relume-shelf";
import { changeShelfBlock } from "../actions";

/**
 * "In this site" with Remove, or Add. Each button runs the same command as
 * the terminal and shows what it printed, a refusal included.
 */
export function ShelfControl({ slug, inSite }: { slug: string; inSite: boolean }) {
  const [pending, startTransition] = useTransition();
  const [running, setRunning] = useState<"add" | "remove" | null>(null);
  const [result, setResult] = useState<ShelfCommandResult | null>(null);

  function run(command: "add" | "remove") {
    setRunning(command);
    setResult(null);
    startTransition(async () => {
      try {
        setResult(await changeShelfBlock(command, slug));
      } catch {
        setResult({
          ok: false,
          output: "The request failed before the command reported back. Reload to see the site's blocks.",
        });
      }
    });
  }

  return (
    <div className="flex flex-col gap-2" aria-busy={pending}>
      <div className="flex items-center justify-between gap-2">
        {inSite ? (
          <span
            className="rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800"
            data-in-site="true"
          >
            In this site
          </span>
        ) : (
          <span className="text-xs text-zinc-500" data-in-site="false">
            Not in this site
          </span>
        )}
        {inSite ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => run("remove")}
          >
            {pending && running === "remove" ? "Removing…" : "Remove"}
          </Button>
        ) : (
          <Button type="button" size="sm" disabled={pending} onClick={() => run("add")}>
            {pending && running === "add" ? "Adding…" : "Add"}
          </Button>
        )}
      </div>
      {pending ? (
        <p className="text-xs text-zinc-500" role="status">
          Running pnpm relume:{running} {slug}, then the type check. This takes about half a
          minute.
        </p>
      ) : null}
      {result ? (
        <pre
          className={cn(
            "max-h-48 overflow-auto whitespace-pre-wrap rounded border p-2 text-[11px] leading-snug",
            result.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-950"
              : "border-amber-300 bg-amber-50 text-amber-950",
          )}
          role={result.ok ? "status" : "alert"}
          data-result={result.ok ? "ok" : "refused"}
        >
          {result.output}
        </pre>
      ) : null}
    </div>
  );
}
