import { describe, expect, it } from "vitest";
import {
  blockLibraryHref,
  blockPageSlug,
  libraryBlocks,
  libraryCategories,
  parseBlockLibraryFilters,
  relumeBlockType,
  siteBlocks,
} from "./block-library-index";

const entry = (slug: string, name: string, category: string) => ({
  slug,
  name,
  category,
  tags: [],
  preview: "",
  uncommon: false,
  layoutStyle: [],
});

describe("block page paths", () => {
  it("names a block's page as the Studio seed writes it", () => {
    expect(blockPageSlug(entry("header1", "Header 1", "hero-header-sections"))).toBe(
      "block-library/heroes/header-1",
    );
    expect(blockPageSlug(entry("cta3", "CTA 3", "cta-sections"))).toBe(
      "block-library/calls-to-action/cta-3",
    );
  });

  it("links only the blocks whose page exists, sorted by name", () => {
    const blocks = libraryBlocks(
      siteBlocks(() => true, [
        entry("header19", "Header 19", "hero-header-sections"),
        entry("header5", "Header 5", "hero-header-sections"),
      ]),
      new Set(["block-library/heroes/header-19"]),
    );
    expect(blocks.map((block) => [block.name, block.href])).toEqual([
      ["Header 5", null],
      ["Header 19", "/block-library/heroes/header-19"],
    ]);
    expect(libraryCategories(blocks)).toEqual([{ slug: "heroes", label: "Heroes" }]);
  });
});

describe("siteBlocks", () => {
  it("keeps the catalogue entries whose block type this site registers", () => {
    expect(relumeBlockType("layout16")).toBe("relumeLayout16");
    const blocks = siteBlocks((type) => type === "relumeLayout16", [
      entry("layout16", "Layout 16", "feature-sections"),
      entry("layout17", "Layout 17", "feature-sections"),
    ]);
    expect(blocks).toMatchObject([{ slug: "layout16", type: "relumeLayout16", inSite: true }]);
  });
});

describe("index URLs", () => {
  const categories = [{ slug: "heroes", label: "Heroes" }];

  it("reads a known category and drops an unknown one", () => {
    expect(parseBlockLibraryFilters({ category: "heroes" }, categories).category).toBe("heroes");
    expect(parseBlockLibraryFilters({ category: "nope" }, categories).category).toBeNull();
  });

  it("puts the category first and leaves out the inventory's status and decision", () => {
    const filters = parseBlockLibraryFilters(
      { category: "heroes", element: "Buttons", status: "converted", decision: "want" },
      categories,
    );
    expect(blockLibraryHref(filters)).toBe("/block-library?category=heroes&element=Buttons");
    expect(blockLibraryHref(filters, { category: null, element: [] })).toBe("/block-library");
  });
});
