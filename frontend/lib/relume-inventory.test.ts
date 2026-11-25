import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  applyDecisions,
  activeCounts,
  categoryLabel,
  classifyTag,
  decisionsPath,
  filterComponents,
  filterHref,
  filterOptions,
  findRepoRoot,
  loadInventory,
  parseFilters,
  readDecisions,
  serializeDecisions,
  summarizeCategories,
  toggleTagHref,
  writeDecision,
  type InventoryRecord,
} from "./relume-inventory";

function record(overrides: Partial<InventoryRecord> & { slug: string }): InventoryRecord {
  return {
    name: overrides.slug,
    category: "feature-sections",
    tags: [],
    preview: `https://example.test/${overrides.slug}.png`,
    uncommon: false,
    layoutStyle: [],
    status: "not-pulled",
    reasons: [],
    decision: null,
    ...overrides,
  };
}

let root: string;

beforeEach(() => {
  root = mkdtempSync(path.join(os.tmpdir(), "relume-inventory-"));
  writeFileSync(path.join(root, "pnpm-workspace.yaml"), "packages: []\n");
  mkdirSync(path.join(root, "relume"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("decisions file", () => {
  it("reads a missing file as no decisions", () => {
    expect(readDecisions(root)).toEqual({});
  });

  it("writes sorted keys with 2-space indent and a trailing newline", () => {
    writeDecision(root, "layout16", "want");
    writeDecision(root, "cta1", "skip");
    writeDecision(root, "header1", "want");

    expect(readFileSync(decisionsPath(root), "utf8")).toBe(
      '{\n  "cta1": "skip",\n  "header1": "want",\n  "layout16": "want"\n}\n',
    );
    expect(Object.keys(readDecisions(root))).toEqual(["cta1", "header1", "layout16"]);
  });

  it("changes a decision in place and Clear removes the key", () => {
    writeDecision(root, "layout16", "want");
    writeDecision(root, "cta1", "want");
    writeDecision(root, "layout16", "skip");
    expect(readDecisions(root)).toEqual({ cta1: "want", layout16: "skip" });

    writeDecision(root, "layout16", null);
    expect(readDecisions(root)).toEqual({ cta1: "want" });

    writeDecision(root, "cta1", null);
    expect(readFileSync(decisionsPath(root), "utf8")).toBe("{}\n");
  });

  it("clearing an undecided slug leaves the file valid", () => {
    writeDecision(root, "layout16", null);
    expect(readFileSync(decisionsPath(root), "utf8")).toBe("{}\n");
  });

  it("rejects malformed slugs and decisions", () => {
    expect(() => writeDecision(root, "../escape", "want")).toThrow(/slug/);
    expect(() => writeDecision(root, "layout16", "maybe" as never)).toThrow(/decision/);
  });

  it("serializes in key order whatever the insertion order", () => {
    expect(serializeDecisions({ b: "skip", a: "want" })).toBe(
      '{\n  "a": "want",\n  "b": "skip"\n}\n',
    );
  });
});

describe("decision overlay", () => {
  it("lets decisions.json win over the inventory's stale decision", () => {
    const components = [
      record({ slug: "layout16", decision: "want" }),
      record({ slug: "cta1", decision: null }),
      record({ slug: "header1", decision: "skip", status: "converted" }),
    ];
    const overlaid = applyDecisions(components, { cta1: "want", header1: "skip" });
    expect(overlaid.map((c) => [c.slug, c.decision])).toEqual([
      ["layout16", null],
      ["cta1", "want"],
      ["header1", "skip"],
    ]);
    // The overlay never touches the status.
    expect(overlaid[2].status).toBe("converted");
  });

  it("applies decisions.json when loading the inventory from disk", () => {
    writeFileSync(
      path.join(root, "relume", "inventory.json"),
      JSON.stringify({
        generatedAt: "2026-11-21T10:00:00.000Z",
        components: [
          record({ slug: "layout16", decision: "want" }),
          record({ slug: "cta1", category: "cta-sections" }),
        ],
      }),
    );
    writeDecision(root, "cta1", "skip");

    const result = loadInventory(root);
    expect(result.state).toBe("ok");
    if (result.state !== "ok") return;
    expect(result.generatedAt).toBe("2026-11-21T10:00:00.000Z");
    expect(result.components.map((c) => [c.slug, c.decision])).toEqual([
      ["layout16", null],
      ["cta1", "skip"],
    ]);
  });

  it("reports a missing inventory with its path", () => {
    expect(loadInventory(root)).toEqual({
      state: "missing",
      path: path.join(root, "relume", "inventory.json"),
    });
  });

  it("reports an unreadable inventory instead of throwing", () => {
    writeFileSync(path.join(root, "relume", "inventory.json"), "{ nope");
    expect(loadInventory(root)).toMatchObject({
      state: "invalid",
      source: "inventory",
      path: path.join(root, "relume", "inventory.json"),
    });
  });

  it("blames the decisions file, not the inventory, when decisions are unreadable", () => {
    writeFileSync(
      path.join(root, "relume", "inventory.json"),
      JSON.stringify({ generatedAt: "", components: [] }),
    );
    writeFileSync(path.join(root, "relume", "decisions.json"), "{ nope");
    expect(loadInventory(root)).toMatchObject({
      state: "invalid",
      source: "decisions",
      path: path.join(root, "relume", "decisions.json"),
    });
  });
});

describe("counting and filtering", () => {
  const components = [
    record({ slug: "layout1", status: "converted", tags: ["Grid"], decision: "want" }),
    record({ slug: "layout2", status: "needs-judgment", tags: ["Grid", "Tabs"] }),
    record({ slug: "layout3", status: "convertible", decision: "skip" }),
    record({ slug: "cta1", category: "cta-sections", status: "not-pulled" }),
  ];

  it("summarizes categories largest first with per-status counts", () => {
    expect(summarizeCategories(components)).toEqual([
      {
        category: "feature-sections",
        label: "Feature Sections",
        total: 3,
        counts: { "not-pulled": 0, convertible: 1, "needs-judgment": 1, converted: 1 },
      },
      {
        category: "cta-sections",
        label: "CTA Sections",
        total: 1,
        counts: { "not-pulled": 1, convertible: 0, "needs-judgment": 0, converted: 0 },
      },
    ]);
  });

  it("names categories as Relume does", () => {
    expect(categoryLabel("hero-header-sections")).toBe("Hero Header Sections");
    expect(categoryLabel("faq-sections")).toBe("FAQ Sections");
  });

  it("filters by status and decision together", () => {
    const slugs = (filters: Record<string, string>) =>
      filterComponents(components, parseFilters(filters)).map((c) => c.slug);
    expect(slugs({ decision: "undecided" })).toEqual(["layout2", "cta1"]);
    expect(slugs({ decision: "skip" })).toEqual(["layout3"]);
    expect(slugs({ status: "converted", decision: "want" })).toEqual(["layout1"]);
    // Unknown values are ignored rather than hiding everything.
    expect(slugs({ status: "bogus" })).toHaveLength(4);
  });
});

describe("tag grouping", () => {
  it("sorts tags into Relume's Layout groups by name", () => {
    expect(classifyTag("Text Align Left")).toEqual({ kind: "layout", group: "text" });
    expect(classifyTag("Text Align Center")).toEqual({ kind: "layout", group: "text" });
    expect(classifyTag("Image/Video Bottom")).toEqual({ kind: "layout", group: "content" });
    expect(classifyTag("1 Column")).toEqual({ kind: "layout", group: "columns" });
    expect(classifyTag("2 Columns")).toEqual({ kind: "layout", group: "columns" });
    expect(classifyTag("5+ Columns")).toEqual({ kind: "layout", group: "columns" });
    expect(classifyTag("Logo Left")).toEqual({ kind: "layout", group: "logo" });
    expect(classifyTag("Menu Right")).toEqual({ kind: "layout", group: "menu" });
    expect(classifyTag("Filter Top")).toEqual({ kind: "layout", group: "filter" });
  });

  it("keeps block-type labels out of Element and everything else in it", () => {
    for (const tag of ["CTA Section", "Hero Header Section", "Marquee Banner", "Navbar", "Footer"]) {
      expect(classifyTag(tag)).toEqual({ kind: "block-type" });
    }
    for (const tag of ["Buttons", "Image", "Video Lightbox", "Newsletter Sign Up", "Image Lightbox", "Sidebar"]) {
      expect(classifyTag(tag)).toEqual({ kind: "element" });
    }
  });
});

describe("per-category options", () => {
  const banners = [
    record({ slug: "banner1", category: "banners", tags: ["Text Align Left", "Icons", "Newsletter Sign Up", "Announcement Banner"] }),
    record({ slug: "banner2", category: "banners", tags: ["Text Align Left", "Icons", "Buttons", "Announcement Banner"] }),
    record({ slug: "banner3", category: "banners", tags: ["Text Align Left", "Buttons"] }),
    record({ slug: "banner11", category: "banners", tags: ["Text Align Center", "Text Only", "Marquee Banner"], uncommon: true }),
  ];

  it("offers only the groups and tags the category has, in Relume's order", () => {
    const options = filterOptions(banners);
    expect(options.layoutGroups).toEqual([
      {
        id: "text",
        label: "Text Alignment",
        options: [
          { tag: "Text Align Left", count: 3 },
          { tag: "Text Align Center", count: 1 },
        ],
      },
    ]);
    // Most used first; the block-type labels are not offered.
    expect(options.elements).toEqual([
      { tag: "Buttons", count: 2 },
      { tag: "Icons", count: 2 },
      { tag: "Newsletter Sign Up", count: 1 },
      { tag: "Text Only", count: 1 },
    ]);
    expect(options.offGrid).toBe(0);
    expect(options.uncommon).toBe(1);
    expect(options.interactions).toBe(0);
  });

  it("orders content alignment and columns the way Relume lists them", () => {
    const options = filterOptions([
      record({ slug: "a", tags: ["Image/Video Top", "3 Columns", "Image/Video Left"] }),
      record({ slug: "b", tags: ["Image/Video Bottom", "1 Column", "Image/Video Center"] }),
      record({ slug: "c", tags: ["Image/Video Right", "2 Columns", "5+ Columns"] }),
    ]);
    expect(options.layoutGroups.map((group) => [group.label, group.options.map((o) => o.tag)])).toEqual([
      ["Content Alignment", ["Image/Video Left", "Image/Video Center", "Image/Video Right", "Image/Video Bottom", "Image/Video Top"]],
      ["Columns", ["1 Column", "2 Columns", "3 Columns", "5+ Columns"]],
    ]);
  });

  it("keeps a selected tag the category lacks, at 0, so it can be unticked", () => {
    const options = filterOptions(banners, { layout: ["2 Columns"], element: ["Form"] });
    expect(options.layoutGroups.find((group) => group.id === "columns")?.options).toEqual([
      { tag: "2 Columns", count: 0 },
    ]);
    expect(options.elements).toContainEqual({ tag: "Form", count: 0 });
  });
});

describe("tag filters", () => {
  const heroes = [
    record({ slug: "h1", tags: ["Text Align Left", "Image/Video Right", "2 Columns", "Buttons", "Image"] }),
    record({ slug: "h2", tags: ["Text Align Left", "Image/Video Center", "1 Column", "Form", "Image"], layoutStyle: ["off_grid", "background"] }),
    record({ slug: "h3", tags: ["Text Align Center", "Image/Video Bottom", "1 Column", "Buttons", "Video Lightbox"], uncommon: true, preview: "https://cdn.example.com/Header3.GIF?v=2" }),
    record({ slug: "h4", tags: ["Text Align Center", "Image/Video Center", "1 Column", "Buttons", "Image"], uncommon: true, layoutStyle: ["off_grid"], status: "converted", decision: "want" }),
  ];
  const slugs = (params: Record<string, string | string[]>) =>
    filterComponents(heroes, parseFilters(params)).map((c) => c.slug);

  it("ORs ticked boxes within one Layout group", () => {
    expect(slugs({ layout: "Text Align Left" })).toEqual(["h1", "h2"]);
    expect(slugs({ layout: ["Image/Video Right", "Image/Video Bottom"] })).toEqual(["h1", "h3"]);
  });

  it("ANDs Layout groups with each other", () => {
    expect(slugs({ layout: ["Text Align Left", "1 Column"] })).toEqual(["h2"]);
    expect(slugs({ layout: ["Text Align Left", "Text Align Center", "Image/Video Center"] })).toEqual(["h2", "h4"]);
  });

  it("requires every ticked Element", () => {
    expect(slugs({ element: "Image" })).toEqual(["h1", "h2", "h4"]);
    expect(slugs({ element: ["Buttons", "Image"] })).toEqual(["h1", "h4"]);
    expect(slugs({ element: ["Form", "Video Lightbox"] })).toEqual([]);
  });

  it("narrows to the flag when a toggle is on and shows everything when off", () => {
    expect(slugs({ uncommon: "1" })).toEqual(["h3", "h4"]);
    expect(slugs({ offGrid: "1" })).toEqual(["h2", "h4"]);
    expect(slugs({ interactions: "1" })).toEqual(["h3"]);
    expect(slugs({ uncommon: "0", offGrid: "" })).toEqual(["h1", "h2", "h3", "h4"]);
  });

  it("ANDs Layout, Element, toggles, Status and Decision", () => {
    expect(slugs({ layout: "1 Column", element: "Image", offGrid: "1" })).toEqual(["h2", "h4"]);
    expect(slugs({ layout: "1 Column", element: "Image", offGrid: "1", uncommon: "1" })).toEqual(["h4"]);
    expect(slugs({ layout: "Text Align Center", status: "converted", decision: "want" })).toEqual(["h4"]);
    expect(slugs({ layout: "Text Align Center", decision: "undecided" })).toEqual(["h3"]);
  });
});

describe("URL state", () => {
  it("parses repeated tag params, toggles and drops values in the wrong list", () => {
    expect(
      parseFilters({
        status: "convertible",
        layout: ["Text Align Left", "Buttons", "Text Align Left", " 2 Columns "],
        element: ["Buttons", "1 Column", "CTA Section", ""],
        offGrid: "1",
        uncommon: "true",
        interactions: "1",
      }),
    ).toEqual({
      status: "convertible",
      decision: null,
      layout: ["Text Align Left", "2 Columns"],
      element: ["Buttons"],
      offGrid: true,
      uncommon: true,
      interactions: true,
    });
    expect(parseFilters({})).toEqual({
      status: null,
      decision: null,
      layout: [],
      element: [],
      offGrid: false,
      uncommon: false,
      interactions: false,
    });
  });

  it("builds shareable URLs that parse back to the same filters", () => {
    const base = "/dev/relume/hero-header-sections";
    const filters = parseFilters({ status: "convertible", layout: "Text Align Left" });
    const url = filterHref(base, filters, {
      decision: "want",
      element: ["Buttons", "Video Lightbox"],
      uncommon: true,
      interactions: true,
    });
    expect(url).toBe(
      `${base}?status=convertible&decision=want&layout=Text+Align+Left&element=Buttons&element=Video+Lightbox&uncommon=1&interactions=1`,
    );
    const params = new URL(url, "http://localhost").searchParams;
    const parsed = parseFilters({
      status: params.get("status") ?? undefined,
      decision: params.get("decision") ?? undefined,
      layout: params.getAll("layout"),
      element: params.getAll("element"),
      uncommon: params.get("uncommon") ?? undefined,
      interactions: params.get("interactions") ?? undefined,
    });
    expect(filterHref(base, parsed)).toBe(url);
    expect(filterHref(base, filters, { status: null, layout: [] })).toBe(base);
  });

  it("toggles a card's tag in its own list; a block-type label has no link", () => {
    const base = "/dev/relume/banners";
    const filters = parseFilters({ layout: "Text Align Left" });
    expect(toggleTagHref(base, filters, "Text Align Left")).toBe(base);
    expect(toggleTagHref(base, filters, "Buttons")).toBe(`${base}?layout=Text+Align+Left&element=Buttons`);
    expect(toggleTagHref(base, filters, "Announcement Banner")).toBeNull();
  });

  it("counts each control's selections for its button", () => {
    expect(
      activeCounts(parseFilters({ layout: ["Text Align Left", "1 Column"], offGrid: "1", element: "Buttons", uncommon: "1", interactions: "1", status: "converted" })),
    ).toEqual({ status: 1, decision: 0, layout: 3, element: 1, more: 2 });
  });
});

describe("repo root", () => {
  it("walks up to the directory holding pnpm-workspace.yaml", () => {
    const frontend = path.join(root, "frontend", "app");
    mkdirSync(frontend, { recursive: true });
    expect(findRepoRoot(frontend)).toBe(root);
  });

  it("finds this repo from the frontend workspace", () => {
    expect(readFileSync(path.join(findRepoRoot(), "pnpm-workspace.yaml"), "utf8")).toBeTruthy();
  });
});
