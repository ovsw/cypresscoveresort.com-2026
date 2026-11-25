// Adds the Relume library's `uncommon` flag and layout styles to
// relume/catalogue.json, from saved `list_components` results of the Relume
// library MCP. See docs/agents/relume-import.md, "Catalogue fields".
//
// The MCP's own slugs are irregular ("section_cta37", "banner1_component",
// "cookie1" for "Cookie Consent 1"), so entries are matched by display name,
// the same way the catalogue's slugs were made.

import { catalogueSlug } from "../split-pull.mjs";

/**
 * Parses one `list_components` result. Each component reads
 * `- <mcp slug>  —  <Name> (<category>)` followed by
 * `tags: a, b  ·  layout: x,y  ·  preview: <url>`; `layout:` is optional.
 * Throws when the count the result announces differs from what it lists, so a
 * cut result cannot pass for a whole one.
 */
export function parseListComponents(text) {
  const announced = text.match(/Showing (\d+) component/);
  if (/No components found\./.test(text) && !announced) return [];
  if (!announced) throw new Error("not a list_components result (no \"Showing N component(s)\" line)");
  const starts = [...text.matchAll(/- (\S+) {2}— {2}/g)];
  const components = starts.map((match, index) => {
    const end = index + 1 < starts.length ? starts[index + 1].index : text.length;
    const body = text.slice(match.index + match[0].length, end);
    const head = body.match(/^(.+?) \(([a-z0-9-]+)\)/);
    if (!head) throw new Error(`cannot read the entry for ${match[1]}`);
    const component = {
      mcpSlug: match[1],
      name: head[1],
      category: head[2],
      tags: [],
      layoutStyle: [],
      preview: "",
    };
    for (const part of body.slice(head[0].length).split("  ·  ")) {
      const value = part.trim();
      if (value.startsWith("tags: ")) {
        component.tags = value.slice(6).split(", ").map((tag) => tag.trim()).filter(Boolean);
      } else if (value.startsWith("layout: ")) {
        component.layoutStyle = value.slice(8).split(",").map((style) => style.trim()).filter(Boolean);
      } else if (value.startsWith("preview: ")) {
        component.preview = value.slice(9).trim();
      }
    }
    // Every library component has tags and a preview. One without them is a
    // result cut inside its last entry, which the count check cannot see.
    if (!component.tags.length || !component.preview) {
      throw new Error(
        `the entry for ${match[1]} has no ${component.tags.length ? "preview" : "tags"}; the result was cut`,
      );
    }
    return component;
  });
  if (components.length !== Number(announced[1])) {
    throw new Error(
      `the result says ${announced[1]} components but lists ${components.length}; it was cut`,
    );
  }
  return components;
}

/**
 * Returns the catalogue with `uncommon` and `layoutStyle` set on every entry,
 * keeping each entry's existing fields and order. `all` is the full pass
 * (every component once); `uncommon` the pass with `uncommon: true`. Refuses
 * unless the full pass names every catalogue entry and nothing else. Tags and
 * preview are refreshed from the library; every entry whose tags, preview or
 * category differ is listed in `differences` (a category is reported, never
 * changed).
 */
export function mergeCatalogueFields(catalogue, { all, uncommon }) {
  const bySlug = new Map();
  for (const component of all) {
    const slug = catalogueSlug(component.name);
    if (bySlug.has(slug)) throw new Error(`two library components map to "${slug}"`);
    bySlug.set(slug, component);
  }
  const uncommonSlugs = new Set(uncommon.map((component) => catalogueSlug(component.name)));
  const known = new Set(catalogue.map((entry) => entry.slug));
  const unmatched = [...bySlug.values()].filter(
    (component) => !known.has(catalogueSlug(component.name)),
  );
  const missing = catalogue.filter((entry) => !bySlug.has(entry.slug));
  const strayUncommon = [...uncommonSlugs].filter((slug) => !bySlug.has(slug));
  if (unmatched.length || missing.length || strayUncommon.length) {
    const list = (items) => items.join(", ") || "none";
    throw new Error(
      [
        "The library results and relume/catalogue.json do not cover the same components.",
        `In the results but not the catalogue: ${list(unmatched.map((c) => `${c.mcpSlug} (${c.name})`))}`,
        `In the catalogue but not the results: ${list(missing.map((entry) => entry.slug))}`,
        `Uncommon but not in the full pass: ${list(strayUncommon)}`,
      ].join("\n"),
    );
  }
  const differences = [];
  const merged = catalogue.map((entry) => {
    const component = bySlug.get(entry.slug);
    const changed = [];
    if (component.category !== entry.category) changed.push("category");
    if (JSON.stringify(component.tags) !== JSON.stringify(entry.tags)) changed.push("tags");
    if (component.preview !== entry.preview) changed.push("preview");
    if (changed.length) differences.push({ slug: entry.slug, fields: changed });
    return {
      ...entry,
      tags: component.tags,
      preview: component.preview,
      uncommon: uncommonSlugs.has(entry.slug),
      layoutStyle: component.layoutStyle,
    };
  });
  return { catalogue: merged, differences };
}

/** The catalogue's own format: one-space indent and a trailing newline. */
export function serializeCatalogue(catalogue) {
  return `${JSON.stringify(catalogue, null, 1)}\n`;
}
