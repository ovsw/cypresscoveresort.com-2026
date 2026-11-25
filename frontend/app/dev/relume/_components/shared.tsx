import { PageShell } from "@/components/relume-browser/page-shell";
import { cn } from "@/lib/utils";
import {
  INVENTORY_COMMAND,
  STATUS_LABELS,
  type InventoryResult,
  type Status,
} from "@/lib/relume-inventory";

export const STATUS_STYLES: Record<Status, string> = {
  "not-pulled": "border-zinc-300 bg-zinc-100 text-zinc-700",
  convertible: "border-sky-300 bg-sky-50 text-sky-800",
  "needs-judgment": "border-amber-300 bg-amber-50 text-amber-900",
  converted: "border-emerald-300 bg-emerald-50 text-emerald-800",
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
        className,
      )}
      data-status={status}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function DevShell(props: Omit<React.ComponentProps<typeof PageShell>, "eyebrow">) {
  return <PageShell eyebrow="Development only" {...props} />;
}

/** Shown when relume/inventory.json is missing or unreadable. */
export function InventoryProblem({
  result,
}: {
  result: Exclude<InventoryResult, { state: "ok" }>;
}) {
  const decisionsBroken =
    result.state === "invalid" && result.source === "decisions";
  return (
    <div className="max-w-2xl rounded-lg border border-amber-300 bg-amber-50 p-5 text-amber-950">
      <p className="font-semibold">
        {result.state === "missing"
          ? "No Relume inventory yet."
          : decisionsBroken
            ? "The Relume decisions file could not be read."
            : "The Relume inventory could not be read."}
      </p>
      <p className="mt-2 text-sm">
        {result.state === "missing" ? "Expected " : "File "}
        <code className="rounded bg-amber-100 px-1">{result.path}</code>
        {result.state === "invalid" ? `: ${result.error}` : "."}
      </p>
      {decisionsBroken ? (
        <p className="mt-3 text-sm">
          Regenerating the inventory does not repair it. Fix that file, or
          restore it from git, then reload.
        </p>
      ) : (
        <>
          <p className="mt-3 text-sm">
            Run this from the repo root, then reload:
          </p>
          <pre className="mt-2 rounded bg-zinc-900 px-3 py-2 text-sm text-zinc-50">
            {INVENTORY_COMMAND}
          </pre>
        </>
      )}
    </div>
  );
}

export function formatGeneratedAt(generatedAt: string) {
  const date = new Date(generatedAt);
  if (!generatedAt || Number.isNaN(date.getTime())) return "unknown";
  return date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
