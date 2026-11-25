import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.hoisted(() => vi.fn());
const loadShelf = vi.hoisted(() => vi.fn());
const runShelfCommand = vi.hoisted(() => vi.fn());
const fetchBlockLibraryPageSlugs = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next/cache", () => ({ refresh }));
vi.mock("@/sanity/lib/live", () => ({
  getDynamicFetchOptions: async () => ({ perspective: "published", stega: false }),
}));
vi.mock("@/sanity/lib/fetch", () => ({ fetchBlockLibraryPageSlugs }));
// This site registers two blocks: Header 1 and Layout 16.
vi.mock("@/components/blocks", () => ({
  isRegisteredBlockType: (type: string) => ["relumeHeader1", "relumeLayout16"].includes(type),
}));
vi.mock("@/lib/relume-shelf", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/relume-shelf")>()),
  loadShelf,
  runShelfCommand,
}));

import { changeShelfBlock } from "./actions";
import BlockLibraryPage from "./page";

async function renderPage(searchParams: Record<string, string> = {}) {
  render(await BlockLibraryPage({ searchParams: Promise.resolve(searchParams) }));
}

function card(slug: string) {
  const item = document.querySelector<HTMLElement>(`li[data-slug="${slug}"]`);
  if (!item) throw new Error(`No card for ${slug}`);
  return item;
}

beforeEach(() => {
  // Header 1 has its page; Layout 16's is missing.
  fetchBlockLibraryPageSlugs.mockResolvedValue([
    "block-library/heroes/header-1",
    "block-library/heroes/header-1/dark",
  ]);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("in production", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
  });

  it("lists this site's blocks without reading the shelf", async () => {
    await renderPage();
    expect(loadShelf).not.toHaveBeenCalled();
    expect(document.querySelectorAll("li[data-slug]")).toHaveLength(2);
    expect(screen.getByRole("heading", { level: 2, name: /Heroes/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /Features/ })).toBeInTheDocument();
  });

  it("links a card to its block page only when the page exists", async () => {
    await renderPage();
    expect(within(card("header1")).getByRole("link", { name: "Header 1" })).toHaveAttribute(
      "href",
      "/block-library/heroes/header-1",
    );
    expect(within(card("layout16")).queryByRole("link", { name: "Layout 16" })).toBeNull();
    expect(within(card("layout16")).getByRole("img")).toBeInTheDocument();
  });

  it("filters by category from the URL", async () => {
    await renderPage({ category: "heroes" });
    expect(document.querySelectorAll("li[data-slug]")).toHaveLength(1);
    expect(card("header1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Clear all" })).toHaveAttribute(
      "href",
      "/block-library",
    );
  });

  it("ignores an unknown category", async () => {
    await renderPage({ category: "hero-header-sections" });
    expect(document.querySelectorAll("li[data-slug]")).toHaveLength(2);
  });

  it("keeps the category in a card's tag links", async () => {
    await renderPage({ category: "heroes" });
    expect(within(card("header1")).getByRole("link", { name: "Buttons" })).toHaveAttribute(
      "href",
      "/block-library?category=heroes&element=Buttons",
    );
  });

  it("shows no shelf controls and no link to the inventory", async () => {
    await renderPage();
    expect(screen.queryByRole("button", { name: /Add|Remove/ })).toBeNull();
    expect(document.querySelector('a[href^="/dev/"]')).toBeNull();
    expect(screen.queryByText(/Development/)).toBeNull();
  });

  it("the shelf action refuses and runs nothing", async () => {
    await expect(changeShelfBlock("add", "layout16")).resolves.toEqual({
      ok: false,
      output: expect.stringMatching(/next dev/),
    });
    expect(runShelfCommand).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("in development", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
  });

  it("lists the shelf with Add and Remove and links the inventory", async () => {
    loadShelf.mockResolvedValue({
      state: "ok",
      source: "this Starter",
      blocks: [
        {
          slug: "header1",
          type: "relumeHeader1",
          name: "Header 1",
          category: "hero-header-sections",
          tags: ["Buttons"],
          preview: "https://example.test/header1.png",
          uncommon: false,
          layoutStyle: [],
          inSite: true,
        },
        {
          slug: "cta3",
          type: "relumeCta3",
          name: "CTA 3",
          category: "cta-sections",
          tags: [],
          preview: "",
          uncommon: false,
          layoutStyle: [],
          inSite: false,
        },
      ],
    });
    await renderPage();
    expect(within(card("header1")).getByRole("button", { name: "Remove" })).toBeInTheDocument();
    expect(within(card("cta3")).getByRole("button", { name: "Add" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Relume inventory" })).toHaveAttribute(
      "href",
      "/dev/relume",
    );
  });

  it("lists this site's blocks and the problem when the shelf cannot be read", async () => {
    loadShelf.mockResolvedValue({ state: "error", error: "No access to the Starter." });
    await renderPage();
    expect(screen.getByText("No access to the Starter.")).toBeInTheDocument();
    expect(document.querySelectorAll("li[data-slug]")).toHaveLength(2);
  });

  it("the shelf action rejects a malformed slug", async () => {
    await expect(changeShelfBlock("add", "../x")).resolves.toMatchObject({ ok: false });
    expect(runShelfCommand).not.toHaveBeenCalled();
  });
});
