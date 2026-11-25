import { describe, expect, it } from "vitest";
import { blockLibraryBlockPage } from "./block-library";

const id = "starter-page-block-library-hero-header-sections-header1";

describe("blockLibraryBlockPage", () => {
  it("reads a Light block page from its slug", () => {
    expect(
      blockLibraryBlockPage({ _id: id, slug: "block-library/heroes/header-1" }),
    ).toEqual({
      indexPath: "/block-library?category=heroes",
      darkPath: "/block-library/heroes/header-1/dark",
      lightPath: "/block-library/heroes/header-1",
      theme: "light",
    });
  });

  it("reads a Dark block page, also as a draft", () => {
    expect(
      blockLibraryBlockPage({
        _id: `drafts.${id}-dark`,
        slug: "block-library/calls-to-action/cta-1/dark",
      }),
    ).toMatchObject({
      indexPath: "/block-library?category=calls-to-action",
      lightPath: "/block-library/calls-to-action/cta-1",
      theme: "dark",
    });
  });

  it("leaves out the retired index and category pages, and other pages", () => {
    const pages = [
      { _id: "starter-page-block-library", slug: "block-library" },
      { _id: `${id}`, slug: "block-library/heroes" },
      { _id: `${id}`, slug: "block-library/heroes/header-1/light" },
      { _id: `${id}`, slug: "block-library/heroes/header-1/dark/more" },
      { _id: "page-about", slug: "block-library/heroes/header-1" },
    ];
    for (const page of pages) expect(blockLibraryBlockPage(page)).toBeNull();
  });
});
