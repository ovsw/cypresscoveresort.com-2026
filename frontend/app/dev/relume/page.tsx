import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  countStatuses,
  findRepoRoot,
  isDevelopment,
  loadInventory,
  STATUSES,
  summarizeCategories,
} from "@/lib/relume-inventory";
import {
  DevShell,
  formatGeneratedAt,
  InventoryProblem,
  StatusBadge,
} from "./_components/shared";

// Development-only tool: it reads files from disk on every request.
export const instant = false;

export const metadata: Metadata = {
  title: "Relume inventory",
  robots: { index: false, follow: false },
};

export default async function RelumeInventoryPage() {
  if (!isDevelopment()) notFound();
  await connection();

  const result = loadInventory(findRepoRoot());
  if (result.state !== "ok") {
    return (
      <DevShell title="Relume inventory">
        <InventoryProblem result={result} />
      </DevShell>
    );
  }

  const categories = summarizeCategories(result.components);
  const totals = countStatuses(result.components);
  const wanted = result.components.filter((c) => c.decision === "want").length;
  const skipped = result.components.filter((c) => c.decision === "skip").length;

  return (
    <DevShell title="Relume inventory">
      <p className="mb-6 text-sm text-zinc-600">
        {result.components.length} Relume components in {categories.length} categories.
        {" "}Want {wanted}, skip {skipped}. Inventory generated{" "}
        <time dateTime={result.generatedAt}>{formatGeneratedAt(result.generatedAt)}</time>.
        {" "}
        <Link href="/block-library" className="font-medium text-zinc-900 underline underline-offset-2">
          Block library
        </Link>
        : the converted blocks on the shelf, which a site can add.
      </p>

      <table className="w-full max-w-5xl border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-zinc-300 text-left">
            <th className="py-2 pr-4 font-semibold">Category</th>
            {STATUSES.map((status) => (
              <th key={status} className="px-3 py-2 text-right font-semibold">
                <StatusBadge status={status} />
              </th>
            ))}
            <th className="py-2 pl-3 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.category} className="border-b border-zinc-200 hover:bg-zinc-50">
              <td className="py-2 pr-4">
                <Link
                  href={`/dev/relume/${category.category}`}
                  className="font-medium text-zinc-900 underline-offset-2 hover:underline"
                >
                  {category.label}
                </Link>
              </td>
              {STATUSES.map((status) => (
                <td
                  key={status}
                  className={`px-3 py-2 text-right tabular-nums ${category.counts[status] ? "" : "text-zinc-300"}`}
                >
                  {category.counts[status]}
                </td>
              ))}
              <td className="py-2 pl-3 text-right font-semibold tabular-nums">
                {category.total}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-zinc-300 font-semibold">
            <td className="py-2 pr-4">All categories</td>
            {STATUSES.map((status) => (
              <td key={status} className="px-3 py-2 text-right tabular-nums">
                {totals[status]}
              </td>
            ))}
            <td className="py-2 pl-3 text-right tabular-nums">{result.components.length}</td>
          </tr>
        </tfoot>
      </table>
    </DevShell>
  );
}
