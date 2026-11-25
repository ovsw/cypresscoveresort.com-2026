import type { Metadata } from "next";
import Link from "next/link";
import { isRegisteredBlockType } from "@/components/blocks";
import { FilterMenu, type FilterMenuGroup } from "@/components/relume-browser/filter-menu";
import { PageShell } from "@/components/relume-browser/page-shell";
import { BLOCK_LIBRARY_PATH } from "@/lib/block-library";
import {
  blockLibraryHref,
  blockLibraryTagHref,
  filterLibraryBlocks,
  inCategory,
  libraryBlocks,
  libraryCategories,
  parseBlockLibraryFilters,
  siteBlocks,
  type BlockLibraryFilters,
  type LibraryBlock,
} from "@/lib/block-library-index";
import {
  activeCounts,
  filterOptions,
  findRepoRoot,
  isDevelopment,
  toggleValue,
  type FilterOption,
} from "@/lib/relume-inventory";
import { asFilterRecord, loadShelf } from "@/lib/relume-shelf";
import { cn } from "@/lib/utils";
import { fetchBlockLibraryPageSlugs } from "@/sanity/lib/fetch";
import { getDynamicFetchOptions } from "@/sanity/lib/live";
import { ShelfControl } from "./_components/shelf-control";

const OFF_GRID_HELP =
  "Relume's off-grid layout style: content set off the regular column grid.";
const UNCOMMON_HELP =
  "Blocks Relume marks as uncommon. Off shows every block, common and uncommon.";
const INTERACTIONS_HELP =
  "Blocks with animation or scroll effects: those Relume previews with an animated GIF. Off shows every block.";

// Every request reads its filters from the URL; under `next dev` it also
// reads the shelf from disk.
export const instant = false;

export const metadata: Metadata = {
  title: "Block library",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function Thumbnail({ block }: { block: LibraryBlock }) {
  return block.preview ? (
    // Relume's remote previews: a plain lazy <img> keeps next.config's
    // image hosts limited to Sanity's CDN.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={block.preview}
      alt={`${block.name} preview`}
      loading="lazy"
      decoding="async"
      className="h-full w-full object-contain object-top"
    />
  ) : null;
}

function BlockCard({
  block,
  filters,
  development,
}: {
  block: LibraryBlock;
  filters: BlockLibraryFilters;
  development: boolean;
}) {
  const thumbnailClass = "block aspect-[16/10] border-b border-zinc-200 bg-zinc-50";
  return (
    <li
      className="flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"
      data-slug={block.slug}
    >
      {/* A card whose page is missing or unpublished keeps its thumbnail
          and name, without a link. */}
      {block.href ? (
        <Link href={block.href} aria-label={block.name} className={thumbnailClass}>
          <Thumbnail block={block} />
        </Link>
      ) : (
        <div className={thumbnailClass}>
          <Thumbnail block={block} />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div>
          <h3 className="text-sm font-semibold leading-tight">{block.name}</h3>
          <code className="text-xs text-zinc-500">{block.slug}</code>
        </div>
        {block.tags.length ? (
          <ul className="flex flex-wrap gap-1">
            {block.tags.map((tag) => {
              const href = blockLibraryTagHref(filters, tag);
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
        {development ? (
          <div className="mt-auto border-t border-zinc-100 pt-2">
            <ShelfControl slug={block.slug} inSite={block.inSite} />
          </div>
        ) : null}
      </div>
    </li>
  );
}

export default async function BlockLibraryPage({ searchParams }: Props) {
  // The shelf, its Add and Remove buttons and the link to the inventory read
  // and write files on disk: development only. Production lists this site's
  // own blocks, bundled at build time.
  const development = isDevelopment();
  const [{ perspective }, params, shelf] = await Promise.all([
    getDynamicFetchOptions(),
    searchParams,
    development ? loadShelf(findRepoRoot()) : null,
  ]);
  const pageSlugs = await fetchBlockLibraryPageSlugs({ perspective });
  const blocks = libraryBlocks(
    shelf?.state === "ok" ? shelf.blocks : siteBlocks(isRegisteredBlockType),
    new Set(pageSlugs.filter((slug): slug is string => Boolean(slug))),
  );

  const categories = libraryCategories(blocks);
  const filters = parseBlockLibraryFilters(params, categories);
  const candidates = inCategory(blocks, filters.category);
  const shown = filterLibraryBlocks(blocks, filters);
  const shownCategories = libraryCategories(shown);

  const options = filterOptions(candidates.map(asFilterRecord), filters);
  const active = activeCounts(filters);
  const href = (change: Partial<BlockLibraryFilters>) => blockLibraryHref(filters, change);
  const checkbox = (list: "layout" | "element") => (option: FilterOption) => ({
    type: "checkbox" as const,
    label: option.tag,
    count: option.count,
    checked: filters[list].includes(option.tag),
    href: href({ [list]: toggleValue(filters[list], option.tag) }),
  });
  const categoryGroups: FilterMenuGroup[] = [
    {
      items: categories.map((category) => ({
        type: "radio",
        label: category.label,
        count: blocks.filter((block) => block.categorySlug === category.slug).length,
        checked: filters.category === category.slug,
        href: href({ category: filters.category === category.slug ? null : category.slug }),
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
  const hasFilters = Boolean(filters.category) || Object.values(active).some(Boolean);
  const inSite = blocks.filter((block) => block.inSite).length;

  return (
    <PageShell
      title="Block library"
      eyebrow={development ? "Development view" : undefined}
      crumbs={development ? [{ href: "/dev/relume", label: "Relume inventory" }] : undefined}
    >
      {shelf && shelf.state !== "ok" ? (
        <div className="mb-5 max-w-3xl rounded-lg border border-amber-300 bg-amber-50 p-5 text-amber-950">
          <p className="font-semibold">
            The shelf could not be read, so this lists only the blocks in this site.
          </p>
          <pre className="mt-2 whitespace-pre-wrap text-sm">{shelf.error}</pre>
        </div>
      ) : null}
      <p className="mb-5 text-sm text-zinc-600">
        {development && shelf?.state === "ok" ? (
          <>
            {blocks.length} blocks on the shelf, read from {shelf.source}. {inSite} in this
            site. Add and Remove run <code>pnpm relume:add</code> and{" "}
            <code>pnpm relume:remove</code>.
          </>
        ) : (
          <>
            {blocks.length} {blocks.length === 1 ? "block" : "blocks"} in this site. Each card
            opens the block&apos;s own page, on Light and on Dark.
          </>
        )}
      </p>

      <div
        className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3"
        role="toolbar"
        aria-label="Filters"
      >
        {categories.length ? (
          <FilterMenu
            label="Category"
            active={filters.category ? 1 : 0}
            groups={categoryGroups}
            clearHref={href({ category: null })}
            currentHref={href({})}
          />
        ) : null}
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
        <p className="ml-auto text-sm text-zinc-600" data-testid="match-count">
          <span className="font-semibold text-zinc-900 tabular-nums">{shown.length}</span> of{" "}
          {blocks.length} blocks
        </p>
        {hasFilters ? (
          <Link
            href={BLOCK_LIBRARY_PATH}
            scroll={false}
            className="text-sm text-zinc-600 underline underline-offset-2 hover:text-zinc-900"
          >
            Clear all
          </Link>
        ) : null}
      </div>

      {shownCategories.length ? (
        shownCategories.map((category) => {
          const inThisCategory = shown.filter((block) => block.categorySlug === category.slug);
          return (
            <section
              key={category.slug}
              className="mb-10"
              aria-labelledby={`category-${category.slug}`}
            >
              <h2 id={`category-${category.slug}`} className="mb-3 text-lg font-semibold">
                {category.label}{" "}
                <span className="text-sm font-normal text-zinc-500">{inThisCategory.length}</span>
              </h2>
              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {inThisCategory.map((block) => (
                  <BlockCard
                    key={block.slug}
                    block={block}
                    filters={filters}
                    development={development}
                  />
                ))}
              </ul>
            </section>
          );
        })
      ) : (
        <p className="text-sm text-zinc-600">
          {blocks.length ? "No blocks match these filters." : "This site has no Relume blocks yet."}
        </p>
      )}
    </PageShell>
  );
}
