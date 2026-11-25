// Tests for the Relume inventory in scripts/relume/lib/inventory.mjs and the
// catalogue fields in scripts/relume/lib/catalogue-fields.mjs. They run on
// small fixtures, except the last tests, which check the committed files.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  buildInventory,
  componentStatus,
  formatTable,
  readDecisions,
  refreshInventory,
  summarise,
} from "./relume/lib/inventory.mjs";
import {
  mergeCatalogueFields,
  parseListComponents,
  serializeCatalogue,
} from "./relume/lib/catalogue-fields.mjs";

const plainSource = (body) => `type Props = { heading: string };
export const Sample = (props: Partial<Props>) => {
  const { heading } = { ...SampleDefaults, ...props };
  return (<section>${body}</section>);
};
export const SampleDefaults: Props = { heading: "Heading" };
`;

const entry = (slug, category = "feature-sections", extra = {}) => ({
  slug,
  name: slug.replace(/(\d+)$/, " $1"),
  category,
  tags: ["Tag"],
  preview: `https://example.com/${slug}.png`,
  ...extra,
});

// The slugs must not exist in the real repository: the dry run checks the
// real registrations and refuses to plan over files that are there.
const catalogue = [
  entry("fixturepulled1", "feature-sections", {
    uncommon: true,
    layoutStyle: ["off_grid", "background"],
  }),
  entry("fixtureconvertible1", "feature-sections", { uncommon: false, layoutStyle: ["standard"] }),
  entry("fixturestopped1"),
  entry("fixtureskipped1", "navbars"),
  entry("fixtureconverted1", "layout-sections"),
];

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), "relume-inventory-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const paths = {
    catalogue: join(dir, "catalogue.json"),
    sourceDir: join(dir, "source"),
    schemaDir: join(dir, "schemas"),
    decisions: join(dir, "decisions.json"),
    inventory: join(dir, "inventory.json"),
  };
  await mkdir(paths.sourceDir);
  await mkdir(paths.schemaDir);
  await writeFile(paths.catalogue, JSON.stringify(catalogue));
  const source = (slug, body) =>
    writeFile(join(paths.sourceDir, `${slug}.tsx`), plainSource(body));
  await source("fixtureconvertible1", "<h2>{heading}</h2>");
  await source("fixturestopped1", "<h2>{heading}</h2><Badge>New</Badge>");
  await source("fixtureskipped1", "<h2>{heading}</h2>");
  // A converted block keeps its source; the schema decides.
  await source("fixtureconverted1", "<h2>{heading}</h2><Badge>New</Badge>");
  await writeFile(join(paths.schemaDir, "fixtureconverted1.ts"), "");
  return paths;
}

test("each catalogue entry gets exactly one status", async (t) => {
  const paths = await fixture(t);
  const status = (slug) =>
    componentStatus(
      catalogue.find((component) => component.slug === slug),
      { ...paths, catalogue },
    );

  assert.deepEqual(await status("fixturepulled1"), {
    status: "not-pulled",
    reasons: [],
  });
  assert.deepEqual(await status("fixtureconvertible1"), {
    status: "convertible",
    reasons: [],
  });
  assert.deepEqual(await status("fixtureconverted1"), {
    status: "converted",
    reasons: [],
  });

  const stopped = await status("fixturestopped1");
  assert.equal(stopped.status, "needs-judgment");
  assert.match(stopped.reasons.join("\n"), /<Badge>/);
  const skipped = await status("fixtureskipped1");
  assert.equal(skipped.status, "needs-judgment");
  assert.match(skipped.reasons.join("\n"), /navigation document/);
});

test("an error other than a stop is a reason, not a crash", async (t) => {
  const paths = await fixture(t);
  // Not in the catalogue the converter is given, so it throws a plain Error.
  const result = await componentStatus(entry("fixtureconvertible1"), {
    ...paths,
    catalogue: [],
  });
  assert.equal(result.status, "needs-judgment");
  assert.match(result.reasons[0], /is not in relume\/catalogue\.json/);
});

test("the inventory lists every entry in catalogue order with its decision", async (t) => {
  const paths = await fixture(t);
  await writeFile(
    paths.decisions,
    `${JSON.stringify({ fixtureconverted1: "skip", fixturepulled1: "want" }, null, 2)}\n`,
  );
  const before = await readFile(paths.catalogue, "utf8");
  const inventory = await refreshInventory(paths);

  assert.ok(!Number.isNaN(Date.parse(inventory.generatedAt)));
  assert.deepEqual(
    inventory.components.map(({ slug, status, decision }) => [slug, status, decision]),
    [
      ["fixturepulled1", "not-pulled", "want"],
      ["fixtureconvertible1", "convertible", null],
      ["fixturestopped1", "needs-judgment", null],
      ["fixtureskipped1", "needs-judgment", null],
      ["fixtureconverted1", "converted", "skip"],
    ],
  );
  assert.deepEqual(Object.keys(inventory.components[0]), [
    "slug",
    "name",
    "category",
    "tags",
    "preview",
    "uncommon",
    "layoutStyle",
    "status",
    "reasons",
    "decision",
  ]);
  // The library's fields pass through; an entry without them is common with
  // no layout style.
  assert.deepEqual(
    inventory.components.map(({ slug, uncommon, layoutStyle }) => [slug, uncommon, layoutStyle]),
    [
      ["fixturepulled1", true, ["off_grid", "background"]],
      ["fixtureconvertible1", false, ["standard"]],
      ["fixturestopped1", false, []],
      ["fixtureskipped1", false, []],
      ["fixtureconverted1", false, []],
    ],
  );
  assert.deepEqual(JSON.parse(await readFile(paths.inventory, "utf8")), inventory);
  // The dry run writes nothing.
  assert.equal(await readFile(paths.catalogue, "utf8"), before);
  assert.equal(existsSync(join(paths.schemaDir, "fixtureconvertible1.ts")), false);
});

test("the table counts each category and totals every entry", async (t) => {
  const { components } = await buildInventory(await fixture(t));
  const { rows, totals } = summarise(components);
  assert.equal(rows[0].category, "feature-sections");
  assert.equal(rows[0].total, 3);
  assert.deepEqual(totals, {
    category: "Total",
    "not-pulled": 1,
    convertible: 1,
    "needs-judgment": 2,
    converted: 1,
    total: catalogue.length,
  });
  const table = formatTable(components).split("\n");
  assert.match(table[0], /^Category\s+Not pulled\s+Convertible\s+Needs judgment\s+Converted\s+Total$/);
  assert.match(table.at(-1), /^Total\s+1\s+1\s+2\s+1\s+5$/);
});

test("decisions: a missing file means none, a valid file is read, a bad value is refused", async (t) => {
  const paths = await fixture(t);
  assert.deepEqual(await readDecisions(paths.decisions), {});

  await writeFile(paths.decisions, '{\n  "layout1": "skip",\n  "layout16": "want"\n}\n');
  assert.deepEqual(await readDecisions(paths.decisions), {
    layout1: "skip",
    layout16: "want",
  });

  await writeFile(paths.decisions, '{ "layout1": "maybe" }\n');
  await assert.rejects(readDecisions(paths.decisions), /a decision is "want" or "skip"/);
});

test("the committed decisions file is valid", async () => {
  const path = new URL("../relume/decisions.json", import.meta.url);
  const text = await readFile(path, "utf8");
  const decisions = await readDecisions(path);
  const sorted = Object.fromEntries(Object.entries(decisions).sort(([a], [b]) => (a < b ? -1 : 1)));
  assert.equal(text, `${JSON.stringify(sorted, null, 2)}\n`);
});

// A list_components result as the Relume library MCP prints it.
const listResult = `Showing 3 component(s) in "cta-sections". Use get_component with a slug to fetch its React code.

- section_cta37  —  CTA 37 (cta-sections)
    tags: Text Align Center, 1 Column, Buttons  ·  layout: standard  ·  preview: https://example.com/cta37.png
- banner1_component  —  Banner 1 (banners)
    tags: Text Align Left, Icons  ·  preview: https://example.com/banner1.png
- cookie1  —  Cookie Consent 1 (cookie-consent)
    tags: Text Only  ·  layout: off_grid,background  ·  preview: https://example.com/cookie1.gif
`;

test("list_components results parse into slug, tags, layout styles and preview", () => {
  assert.deepEqual(parseListComponents(listResult), [
    {
      mcpSlug: "section_cta37",
      name: "CTA 37",
      category: "cta-sections",
      tags: ["Text Align Center", "1 Column", "Buttons"],
      layoutStyle: ["standard"],
      preview: "https://example.com/cta37.png",
    },
    {
      mcpSlug: "banner1_component",
      name: "Banner 1",
      category: "banners",
      tags: ["Text Align Left", "Icons"],
      layoutStyle: [],
      preview: "https://example.com/banner1.png",
    },
    {
      mcpSlug: "cookie1",
      name: "Cookie Consent 1",
      category: "cookie-consent",
      tags: ["Text Only"],
      layoutStyle: ["off_grid", "background"],
      preview: "https://example.com/cookie1.gif",
    },
  ]);
  assert.deepEqual(parseListComponents("No components found."), []);
  // A cut result announces more than it lists.
  assert.throws(
    () => parseListComponents(listResult.split("\n").slice(0, 4).join("\n")),
    /says 3 components but lists 1/,
  );
  // A result cut after its last heading still lists the announced number.
  assert.throws(
    () =>
      parseListComponents(
        'Showing 1 component(s) in "cta-sections".\n\n- section_cta37  —  CTA 37 (cta-sections)',
      ),
    /section_cta37 has no tags; the result was cut/,
  );
});

test("catalogue fields: matched by display name, uncommon from its own pass, order kept", () => {
  const all = parseListComponents(listResult);
  const base = [
    { slug: "banner1", name: "Banner 1", category: "banners", tags: ["Text Align Left", "Icons"], preview: "https://example.com/banner1.png" },
    { slug: "cookieconsent1", name: "Cookie Consent 1", category: "cookie-consent", tags: ["Old"], preview: "https://example.com/cookie1.gif" },
    { slug: "cta37", name: "CTA 37", category: "cta-sections", tags: ["Text Align Center", "1 Column", "Buttons"], preview: "https://example.com/cta37.png" },
  ];
  const { catalogue: merged, differences } = mergeCatalogueFields(base, {
    all,
    uncommon: [all[2]],
  });
  assert.deepEqual(
    merged.map((entry) => [entry.slug, entry.uncommon, entry.layoutStyle, entry.tags]),
    [
      ["banner1", false, [], ["Text Align Left", "Icons"]],
      ["cookieconsent1", true, ["off_grid", "background"], ["Text Only"]],
      ["cta37", false, ["standard"], ["Text Align Center", "1 Column", "Buttons"]],
    ],
  );
  assert.deepEqual(Object.keys(merged[0]), ["slug", "name", "category", "tags", "preview", "uncommon", "layoutStyle"]);
  assert.deepEqual(differences, [{ slug: "cookieconsent1", fields: ["tags"] }]);
  assert.match(serializeCatalogue(merged), /^\[\n \{\n {2}"slug": "banner1",/);

  // Anything the full pass misses, or names in addition, stops the merge.
  assert.throws(
    () => mergeCatalogueFields(base, { all: all.slice(1), uncommon: [] }),
    /In the catalogue but not the results: cta37/,
  );
  assert.throws(
    () => mergeCatalogueFields(base.slice(1), { all, uncommon: [] }),
    /In the results but not the catalogue: banner1_component \(Banner 1\)/,
  );
});

test("the committed catalogue carries the library's fields on every entry", async () => {
  const committed = JSON.parse(
    await readFile(new URL("../relume/catalogue.json", import.meta.url), "utf8"),
  );
  for (const entry of committed) {
    assert.equal(typeof entry.uncommon, "boolean", entry.slug);
    assert.ok(Array.isArray(entry.layoutStyle), entry.slug);
  }
});
