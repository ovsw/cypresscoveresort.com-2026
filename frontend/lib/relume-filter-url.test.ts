import { describe, expect, it } from "vitest";
import { applyHrefChange, nextFilterHref, settleFilterHref } from "./relume-filter-url";

const page = "/dev/relume/hero-header-sections";

describe("applyHrefChange", () => {
  it("replaces a single-value filter chosen twice before the page settles", () => {
    const library = "/block-library";
    const heroes = applyHrefChange(library, library, `${library}?category=heroes`);
    expect(applyHrefChange(heroes, library, `${library}?category=features`)).toBe(
      `${library}?category=features`,
    );
    // A click on another filter keeps the pending category.
    expect(applyHrefChange(heroes, library, `${library}?layout=2+Columns`)).toBe(
      `${library}?category=heroes&layout=2+Columns`,
    );
    // Clearing the category removes it.
    expect(applyHrefChange(heroes, heroes, library)).toBe(library);
  });

  it("is the target itself when nothing is pending", () => {
    expect(applyHrefChange(page, page, `${page}?layout=2+Columns`)).toBe(
      `${page}?layout=2+Columns`,
    );
  });

  it("keeps a first tick that has not landed when a second is made", () => {
    const first = `${page}?layout=Text+Align+Left`;
    // The second row's URL was built before the first tick landed.
    const second = `${page}?layout=2+Columns`;
    expect(applyHrefChange(first, page, second)).toBe(
      `${page}?layout=Text+Align+Left&layout=2+Columns`,
    );
  });

  it("removes only what the row removes", () => {
    const rendered = `${page}?layout=A&layout=B&uncommon=1`;
    const latest = `${page}?layout=A&layout=B&layout=C&uncommon=1`;
    expect(applyHrefChange(latest, rendered, `${page}?layout=B&uncommon=1`)).toBe(
      `${page}?layout=B&layout=C&uncommon=1`,
    );
  });

  it("clears one menu without touching a pending tick in another", () => {
    const rendered = `${page}?layout=A`;
    const latest = `${page}?layout=A&element=Form`;
    expect(applyHrefChange(latest, rendered, page)).toBe(`${page}?element=Form`);
  });
});

describe("nextFilterHref", () => {
  it("builds on a click that has not landed, and forgets it once it has or goes stale", () => {
    const first = nextFilterHref(page, `${page}?layout=A`, 1000);
    expect(first).toBe(`${page}?layout=A`);
    // Second click before the first landed: both kept.
    const both = nextFilterHref(page, `${page}?layout=B`, 1500);
    expect(both).toBe(`${page}?layout=A&layout=B`);
    // The page arrives (the server may order the values differently).
    settleFilterHref(`${page}?layout=B&layout=A`);
    expect(nextFilterHref(page, `${page}?element=Form`, 2000)).toBe(`${page}?element=Form`);
    // Never settled, but long ago: not built on.
    expect(nextFilterHref(page, `${page}?layout=C`, 60_000)).toBe(`${page}?layout=C`);
    settleFilterHref(`${page}?layout=C`);
  });
});
