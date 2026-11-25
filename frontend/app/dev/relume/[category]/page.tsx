import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { cn } from "@/lib/utils";
import {
  activeCounts,
  categoryLabel,
  DECISION_FILTERS,
  DECISION_LABELS,
  filterComponents,
  filterHref,
  filterOptions,
  findRepoRoot,
  isDevelopment,
  loadInventory,
  matchesDecision,
  parseFilters,
  STATUSES,
  STATUS_LABELS,
  toggleTagHref,
  toggleValue,
  type FilterOption,
  type Filters,
  type InventoryRecord,
} from "@/lib/relume-inventory";
import { DecisionControl } from "../_components/decision-control";
import { FilterMenu, type FilterMenuGroup } from "@/components/relume-browser/filter-menu";
import {
  DevShell,
  formatGeneratedAt,
  InventoryProblem,
  StatusBadge,
} from "../_components/shared";

const OFF_GRID_HELP =
  "Relume's off-grid layout style: content set off the regular column grid.";
const UNCOMMON_HELP =
  "Components Relume marks as uncommon. Off shows every component, common and uncommon.";
const INTERACTIONS_HELP =
  "Components with animation or scroll effects: those Relume previews with an animated GIF. Off shows every component.";

// Development-only tool: it reads files from disk on every request.
export const instant = false;

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  return {
    title: `${categoryLabel(category)} · Relume inventory`,
    robots: { index: false, follow: false },
  };
}

function ComponentCard({
  component,
  basePath,
  filters,
}: {
  component: InventoryRecord;
  basePath: string;
  filters: Filters;
}) {
  return (
    <li
      className="flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"
      data-slug={component.slug}
    >
      <a
        href={component.preview}
        target="_blank"
        rel="noreferrer"
        className="block aspect-[16/10] border-b border-zinc-200 bg-zinc-50"
      >
        {component.preview ? (
          // Relume's remote previews: a plain lazy <img> keeps next.config's
          // image hosts untouched for a development-only page.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={component.preview}
            alt={`${component.name} preview`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain object-top"
          />
        ) : null}
      </a>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold leading-tight">{component.name}</h2>
            <code className="text-xs text-zinc-500">{component.slug}</code>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <StatusBadge status={component.status} />
            {component.uncommon ? (
              <span
                className="rounded border border-violet-300 bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-800"
                data-marker="uncommon"
              >
                Uncommon
              </span>
            ) : null}
          </div>
        </div>
        {component.status === "needs-judgment" && component.reasons.length ? (
          <ul className="list-disc space-y-0.5 rounded border border-amber-200 bg-amber-50 py-1.5 pl-6 pr-2 text-xs text-amber-950">
            {component.reasons.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        ) : null}
        {component.tags.length ? (
          <ul className="flex flex-wrap gap-1">
            {component.tags.map((tag) => {
              // A tag toggles its own Layout or Element filter; a block-type
              // label ("CTA Section") has no filter and is plain text.
              const href = toggleTagHref(basePath, filters, tag);
              const selected = filters.layout.includes(tag) || filters.element.includes(tag);
              return (
                <li key={tag}>
                  {href ? (
                    <Link
                      href={href}
                      scroll={false}
                      className={cn(
                        "rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-600 hover:bg-zinc-200",
                        selected && "bg-zinc-800 text-white hover:bg-zinc-700",
                      )}
                    >
                      {tag}
                    </Link>
                  ) : (
                    <span className="rounded border border-dashed border-zinc-200 px-1.5 py-0.5 text-[11px] text-zinc-500">
                      {tag}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        ) : null}
        <div className="mt-auto border-t border-zinc-100 pt-2">
          <DecisionControl slug={component.slug} decision={component.decision} />
        </div>
      </div>
    </li>
  );
}

export default async function RelumeCategoryPage({ params, searchParams }: Props) {
  if (!isDevelopment()) notFound();
  await connection();

  const { category } = await params;
  const label = categoryLabel(category);
  const crumbs = [{ href: "/dev/relume", label: "Relume inventory" }];

  const result = loadInventory(findRepoRoot());
  if (result.state !== "ok") {
    return (
      <DevShell title={label} crumbs={crumbs}>
        <InventoryProblem result={result} />
      </DevShell>
    );
  }

  const inCategory = result.components.filter((c) => c.category === category);
  if (!inCategory.length) notFound();

  const filters = parseFilters(await searchParams);
  const basePath = `/dev/relume/${category}`;
  const shown = filterComponents(inCategory, filters);

  // Status and Decision count what the other filters leave; the tag options
  // list every tag in the category, counted over the whole category.
  const forStatus = filterComponents(inCategory, { ...filters, status: null });
  const forDecision = filterComponents(inCategory, { ...filters, decision: null });
  const options = filterOptions(inCategory, filters);
  const active = activeCounts(filters);
  const href = (change: Partial<Filters>) => filterHref(basePath, filters, change);
  const checkbox = (list: "layout" | "element") => (option: FilterOption) => ({
    type: "checkbox" as const,
    label: option.tag,
    count: option.count,
    checked: filters[list].includes(option.tag),
    href: href({ [list]: toggleValue(filters[list], option.tag) }),
  });

  const statusGroups: FilterMenuGroup[] = [
    {
      items: STATUSES.map((status) => ({
        type: "radio",
        label: STATUS_LABELS[status],
        count: forStatus.filter((c) => c.status === status).length,
        checked: filters.status === status,
        href: href({ status: filters.status === status ? null : status }),
      })),
    },
  ];
  const decisionGroups: FilterMenuGroup[] = [
    {
      items: DECISION_FILTERS.map((decision) => ({
        type: "radio",
        label: DECISION_LABELS[decision],
        count: forDecision.filter((c) => matchesDecision(c.decision, decision)).length,
        checked: filters.decision === decision,
        href: href({ decision: filters.decision === decision ? null : decision }),
      })),
    },
  ];
  const layoutGroups: FilterMenuGroup[] = [
    ...options.layoutGroups.map((group) => ({
      heading: group.label,
      items: group.options.map(checkbox("layout")),
    })),
    ...(options.offGrid || filters.offGrid
      ? [
          {
            items: [
              {
                type: "switch" as const,
                label: "Off-grid",
                count: options.offGrid,
                help: OFF_GRID_HELP,
                checked: filters.offGrid,
                href: href({ offGrid: !filters.offGrid }),
              },
            ],
          },
        ]
      : []),
  ];
  const elementGroups: FilterMenuGroup[] = [
    { items: options.elements.map(checkbox("element")) },
  ];
  const moreGroups: FilterMenuGroup[] = [
    {
      items: [
        {
          type: "switch",
          label: "Uncommon",
          count: options.uncommon,
          help: UNCOMMON_HELP,
          checked: filters.uncommon,
          href: href({ uncommon: !filters.uncommon }),
        },
        {
          type: "switch",
          label: "Interactions",
          count: options.interactions,
          help: INTERACTIONS_HELP,
          checked: filters.interactions,
          href: href({ interactions: !filters.interactions }),
        },
      ],
    },
  ];

  const hasFilters = Object.values(active).some(Boolean);

  return (
    <DevShell title={label} crumbs={crumbs}>
      <p className="mb-5 text-sm text-zinc-600">
        Inventory generated{" "}
        <time dateTime={result.generatedAt}>{formatGeneratedAt(result.generatedAt)}</time>.
      </p>

      <div
        className="mb-6 flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3"
        role="toolbar"
        aria-label="Filters"
      >
        {layoutGroups.length ? (
          <FilterMenu
            label="Layout"
            active={active.layout}
            groups={layoutGroups}
            clearHref={href({ layout: [], offGrid: false })}
            currentHref={href({})}
          />
        ) : null}
        {options.elements.length ? (
          <FilterMenu
            label="Element"
            active={active.element}
            groups={elementGroups}
            clearHref={href({ element: [] })}
            currentHref={href({})}
          />
        ) : null}
        <FilterMenu
          label="More Filters"
          active={active.more}
          groups={moreGroups}
          clearHref={href({ uncommon: false, interactions: false })}
          currentHref={href({})}
        />
        <span className="mx-1 h-6 w-px bg-zinc-300" aria-hidden />
        <FilterMenu
          label="Status"
          active={active.status}
          groups={statusGroups}
          clearHref={href({ status: null })}
          currentHref={href({})}
        />
        <FilterMenu
          label="Decision"
          active={active.decision}
          groups={decisionGroups}
          clearHref={href({ decision: null })}
          currentHref={href({})}
        />
        <p className="ml-auto text-sm text-zinc-600" data-testid="match-count">
          <span className="font-semibold text-zinc-900 tabular-nums">{shown.length}</span> of{" "}
          {inCategory.length} components
        </p>
        {hasFilters ? (
          <Link
            href={basePath}
            scroll={false}
            className="text-sm text-zinc-600 underline underline-offset-2 hover:text-zinc-900"
          >
            Clear all
          </Link>
        ) : null}
      </div>

      {shown.length ? (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {shown.map((component) => (
            <ComponentCard
              key={component.slug}
              component={component}
              basePath={basePath}
              filters={filters}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-600">No components match these filters.</p>
      )}
    </DevShell>
  );
}
