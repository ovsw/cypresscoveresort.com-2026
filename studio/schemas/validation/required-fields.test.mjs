// Runs Studio's own validation on documents, with the Studio's real schema
// types, to check that a block cannot publish without a field it needs to
// draw. See "A block never hides silently" in docs/agents/page-builder.md.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import nodeTest from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const studioUrl = new URL("../../", import.meta.url).href;
const isStudioSource = (url) =>
  url?.startsWith(studioUrl) && !url.includes("/node_modules/");

// The Studio's schema files import without file extensions and import custom
// inputs written in TSX, as the Studio bundler allows. Node needs both
// resolved: try `.ts` and `.tsx`, and compile TSX with TypeScript.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (
        error?.code !== "ERR_MODULE_NOT_FOUND" ||
        !specifier.startsWith(".") ||
        !isStudioSource(context.parentURL)
      ) {
        throw error;
      }
      for (const extension of [".ts", ".tsx"]) {
        try {
          return nextResolve(`${specifier}${extension}`, context);
        } catch {
          // Try the next extension.
        }
      }
      throw error;
    }
  },
  load(url, context, nextLoad) {
    if (!url.endsWith(".tsx") || !isStudioSource(url)) {
      return nextLoad(url, context);
    }
    const source = ts.transpileModule(
      readFileSync(fileURLToPath(url), "utf8"),
      {
        compilerOptions: {
          jsx: ts.JsxEmit.ReactJSX,
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
        },
      },
    ).outputText;
    return { format: "module", shortCircuit: true, source };
  },
});

process.env.SANITY_STUDIO_TITLE ??= "Validation test";
const { schemaTypes } = await import("../../schema-types.ts");
const { createSchema, validateDocument } = await import("sanity");

// A site keeps only the Relume blocks it took from the Starter's shelf, so the
// host holds, and the tests check, only the Relume blocks registered here: a
// test that names a block this site lacks is skipped.
const registered = new Set(schemaTypes.map((type) => type.name));
const test = (name, fn) => {
  const missing = [...new Set(fn.toString().match(/\brelume[A-Z]\w*/g) ?? [])].filter(
    (type) => !registered.has(type),
  );
  return nodeTest(name, missing.length ? { skip: `not in this site: ${missing.join(", ")}` } : {}, fn);
};

// A test-only document that holds the shared objects and blocks, so each
// one is validated exactly as it is inside a page.
const schema = createSchema({
  name: "required-fields-test",
  types: [
    ...schemaTypes,
    {
      name: "testHost",
      type: "document",
      fields: [
        { name: "button", type: "button" },
        { name: "richTextBlock", type: "richTextBlock" },
        { name: "scaffold", type: "scaffold" },
        { name: "richText", type: "richTextContent" },
        { name: "relumePricing18", type: "relumePricing18" },
        { name: "relumeTestimonial17", type: "relumeTestimonial17" },
        { name: "relumeTestimonial6", type: "relumeTestimonial6" },
        { name: "relumeTestimonial18", type: "relumeTestimonial18" },
        { name: "relumeFaq6", type: "relumeFaq6" },
        { name: "relumeCta57", type: "relumeCta57" },
        { name: "relumeLogo3", type: "relumeLogo3" },
        { name: "relumeTimeline1", type: "relumeTimeline1" },
        { name: "relumeEvent9", type: "relumeEvent9" },
        { name: "relumeLayout422", type: "relumeLayout422" },
        { name: "relumeHeader103", type: "relumeHeader103" },
        { name: "relumeLayout348", type: "relumeLayout348" },
        { name: "relumeLayout488", type: "relumeLayout488" },
        { name: "relumeLayout351", type: "relumeLayout351" },
        { name: "relumeLayout487", type: "relumeLayout487" },
      ].filter((field) => registered.has(field.type)),
    },
  ],
});

// No test document references another document, so no request is made.
const client = {
  config: () => ({}),
  fetch: async () => null,
  withConfig: () => client,
};

/** Error messages by path, for example `{ "button.text": "Add the …" }`. */
async function errors(document) {
  const markers = await validateDocument({
    document: { _id: "drafts.test", ...document },
    // "cli" adds an unknown-fields check that turns object rules into
    // warnings; "studio" validates as the editor sees it.
    environment: "studio",
    getDocumentExists: async () => true,
    workspace: { getClient: () => client, schema },
  });
  return Object.fromEntries(
    markers
      .filter((marker) => marker.level === "error")
      .map((marker) => [
        marker.path
          .map((segment) =>
            typeof segment === "object" ? `[${segment._key}]` : segment,
          )
          .join("."),
        marker.message,
      ]),
  );
}

/** The paths with an error, sorted: Studio reports them in no fixed order. */
async function errorPaths(document) {
  return Object.keys(await errors(document)).sort();
}

const block = (text) => ({
  _key: "block",
  _type: "block",
  children: [{ _key: "span", _type: "span", marks: [], text }],
  markDefs: [],
  style: "normal",
});
const link = {
  _type: "customUrl",
  external: "https://example.com",
  type: "external",
};

test("a button needs visible text and a destination", async () => {
  // An empty URL object also reports its own required `type` field.
  assert.deepEqual(
    await errorPaths({ _type: "testHost", button: { _type: "button" } }),
    ["button.text", "button.url", "button.url.type"],
  );
  assert.match(
    (
      await errors({
        _type: "testHost",
        button: { _type: "button", text: "   ", url: link },
      })
    )["button.text"],
    /Add the button text/,
  );
  assert.deepEqual(
    await errors({
      _type: "testHost",
      button: { _type: "button", text: "Book a visit", url: link },
    }),
    {},
  );
});

test("a rich text block needs content", async () => {
  for (const richText of [undefined, [], [block("")], [block("   ")]]) {
    const found = await errors({
      _type: "testHost",
      richTextBlock: { _type: "richTextBlock", richText, theme: "light" },
    });
    assert.deepEqual(Object.keys(found), ["richTextBlock.richText"]);
    assert.match(found["richTextBlock.richText"], /Add the content/);
  }
  assert.deepEqual(
    await errors({
      _type: "testHost",
      richTextBlock: {
        _type: "richTextBlock",
        richText: [block("Visible text")],
        theme: "light",
      },
    }),
    {},
  );
});

test("a rich text item needs the field its renderer draws", async () => {
  assert.deepEqual(
    await errorPaths({
      _type: "testHost",
      richText: [
        { _key: "callout", _type: "callout", body: "  " },
        { _key: "image", _type: "image", alt: "A cabin" },
        { _key: "table", _type: "table", rows: [] },
        {
          _key: "row",
          _type: "table",
          rows: [{ _key: "r", _type: "tableRow", cells: [] }],
        },
      ],
    }),
    [
      "richText.[callout].body",
      "richText.[image]",
      "richText.[row].rows.[r].cells",
      "richText.[table].rows",
    ],
  );
});

test("required text rejects a value of only spaces", async () => {
  const cases = [
    [
      { _type: "testHost", scaffold: { _type: "scaffold", name: " " } },
      "scaffold.name",
    ],
    [{ _type: "faq", title: "  ", body: [block("Yes.")] }, "title"],
    [{ _type: "testimonial", name: "\t", body: [block("Great.")] }, "name"],
  ];
  for (const [document, path] of cases) {
    assert.ok(path in (await errors(document)), `${document._type} ${path}`);
  }
});

test("an FAQ needs its question and answer", async () => {
  for (const body of [[], [block("")], [block("  ")]]) {
    assert.deepEqual(await errorPaths({ _type: "faq", body }), [
      "body",
      "title",
    ]);
  }
  assert.deepEqual(
    await errors({
      _type: "faq",
      title: "Is parking free?",
      body: [block("Yes.")],
    }),
    {},
  );
});

test("rich text with only a non-text member counts as content", async () => {
  assert.deepEqual(
    await errorPaths({
      _type: "testHost",
      richTextBlock: {
        _type: "richTextBlock",
        richText: [{ _key: "callout", _type: "callout", body: "Note" }],
        theme: "light",
      },
    }),
    [],
  );
});

test("a pricing plan needs its name, price and features", async () => {
  const plan = {
    _key: "p",
    _type: "plan",
    name: "Basic plan",
    price: "$19",
    features: ["Feature"],
  };
  const pricing = (plans) => ({
    _type: "testHost",
    relumePricing18: {
      _type: "relumePricing18",
      heading: "Pricing",
      plans,
      theme: "light",
    },
  });
  assert.deepEqual(await errorPaths(pricing([plan])), []);
  assert.deepEqual(
    await errorPaths(
      pricing([{ ...plan, name: " ", price: "", features: [] }]),
    ),
    [
      "relumePricing18.plans.[p].features",
      "relumePricing18.plans.[p].name",
      "relumePricing18.plans.[p].price",
    ],
  );
  assert.deepEqual(await errorPaths(pricing([])), ["relumePricing18.plans"]);
});

test("a star rating is a whole number from 1 to 5", async () => {
  for (const blockType of [
    "relumeTestimonial17",
    "relumeTestimonial6",
    "relumeTestimonial18",
  ]) {
    const review = (rating) => ({
      _type: "testHost",
      [blockType]: {
        _type: blockType,
        heading: "Reviews",
        theme: "light",
        testimonials: [
          {
            _key: "t",
            _type: "testimonial",
            rating,
            quote: "Great stay.",
            name: "Ana",
            // An image without an uploaded asset still reports its own error,
            // so the avatar (and logo) are left out of what this test checks.
          },
        ],
      },
    });
    const ratingPath = `${blockType}.testimonials.[t].rating`;
    for (const rating of [undefined, 0, 6, 4.5]) {
      assert.ok(
        ratingPath in (await errors(review(rating))),
        `${blockType} ${rating}`,
      );
    }
    for (const rating of [1, 5]) {
      assert.ok(
        !(ratingPath in (await errors(review(rating)))),
        `${blockType} ${rating}`,
      );
    }
  }
});

test("a line-by-line heading needs one to three lines, none blank", async () => {
  const cta = (headingLines) => ({
    _type: "testHost",
    relumeCta57: { _type: "relumeCta57", theme: "light", headingLines },
  });
  assert.deepEqual(await errorPaths(cta(["Ready?", "Let us talk"])), []);
  assert.deepEqual(await errorPaths(cta(undefined)), [
    "relumeCta57.headingLines",
  ]);
  assert.deepEqual(await errorPaths(cta([])), ["relumeCta57.headingLines"]);
  assert.deepEqual(await errorPaths(cta(["One", "Two", "Three", "Four"])), [
    "relumeCta57.headingLines",
  ]);
  assert.deepEqual(await errorPaths(cta(["Ready?", "  "])), [
    "relumeCta57.headingLines.1",
  ]);
});

test("a logo loop needs its heading and at least four logos", async () => {
  const logo = (index) => ({
    _key: `l${index}`,
    _type: "image",
    alt: "Acme",
    asset: { _type: "reference", _ref: "image-abc-200x80-png" },
  });
  const loop = (heading, count) => ({
    _type: "testHost",
    relumeLogo3: {
      _type: "relumeLogo3",
      heading,
      logos: Array.from({ length: count }, (_, index) => logo(index)),
      theme: "light",
    },
  });
  assert.deepEqual(await errorPaths(loop("Trusted by", 4)), []);
  assert.deepEqual(await errorPaths(loop("  ", 3)), [
    "relumeLogo3.heading",
    "relumeLogo3.logos",
  ]);
});

test("a timeline needs its heading and entries with a date and a heading", async () => {
  const timeline = (heading, timelines) => ({
    _type: "testHost",
    relumeTimeline1: {
      _type: "relumeTimeline1",
      heading,
      timelines,
      theme: "light",
    },
  });
  const entry = {
    _key: "t",
    _type: "timeline",
    date: "2019",
    heading: "A team of eight",
  };
  assert.deepEqual(await errorPaths(timeline("Our story", [entry])), []);
  assert.deepEqual(
    await errorPaths(
      timeline("Our story", [{ ...entry, date: " ", heading: "" }]),
    ),
    [
      "relumeTimeline1.timelines.[t].date",
      "relumeTimeline1.timelines.[t].heading",
    ],
  );
  assert.deepEqual(await errorPaths(timeline("  ", [])), [
    "relumeTimeline1.heading",
    "relumeTimeline1.timelines",
  ]);
});

const photo = {
  _type: "image",
  asset: { _type: "reference", _ref: "image-abc-1200x800-jpg" },
};

test("an event list needs its heading and events with an image, date, title and link", async () => {
  const events = (heading, list) => ({
    _type: "testHost",
    relumeEvent9: {
      _type: "relumeEvent9",
      heading,
      events: list,
      theme: "light",
    },
  });
  const event = {
    _key: "e",
    _type: "event",
    image: photo,
    date: "2027-02-12",
    title: "Open day",
    link: { _type: "button", text: "View event", url: link },
  };
  assert.deepEqual(await errorPaths(events("Upcoming events", [event])), []);
  assert.deepEqual(
    await errorPaths(
      events("Upcoming events", [{ _key: "e", _type: "event", title: " " }]),
    ),
    [
      "relumeEvent9.events.[e].date",
      "relumeEvent9.events.[e].image",
      "relumeEvent9.events.[e].link",
      // The shared button object checks its own fields, even unset.
      "relumeEvent9.events.[e].link.text",
      "relumeEvent9.events.[e].link.url",
      "relumeEvent9.events.[e].link.url.type",
      "relumeEvent9.events.[e].title",
    ],
  );
  assert.deepEqual(await errorPaths(events("  ", [])), [
    "relumeEvent9.events",
    "relumeEvent9.heading",
  ]);
});

test("two photo panels need the block's heading and each panel's image and heading", async () => {
  const panels = (heading, features) => ({
    _type: "testHost",
    relumeLayout422: {
      _type: "relumeLayout422",
      heading,
      features,
      theme: "light",
    },
  });
  const panel = (key) => ({
    _key: key,
    _type: "feature",
    image: photo,
    heading: "For homeowners",
  });
  assert.deepEqual(
    await errorPaths(panels("Pick a path", [panel("a"), panel("b")])),
    [],
  );
  assert.deepEqual(
    await errorPaths(
      panels("Pick a path", [panel("a"), { _key: "b", _type: "feature" }]),
    ),
    [
      "relumeLayout422.features.[b].heading",
      "relumeLayout422.features.[b].image",
    ],
  );
  assert.deepEqual(await errorPaths(panels("  ", [panel("a")])), [
    "relumeLayout422.features",
    "relumeLayout422.heading",
  ]);
});

test("a tabbed hero needs two to four tabs with a label, a heading and a photo", async () => {
  const hero = (tabs) => ({
    _type: "testHost",
    relumeHeader103: { _type: "relumeHeader103", tabs, theme: "light" },
  });
  const tab = (key) => ({
    _key: key,
    _type: "tab",
    label: "Plan",
    heading: "Start with a plan",
    image: {
      _type: "image",
      asset: { _type: "reference", _ref: "image-abc-1600x900-jpg" },
    },
  });
  assert.deepEqual(await errorPaths(hero([tab("a"), tab("b")])), []);
  assert.deepEqual(
    await errorPaths(
      hero([
        { ...tab("a"), label: " ", heading: "", image: undefined },
        tab("b"),
      ]),
    ),
    [
      "relumeHeader103.tabs.[a].heading",
      "relumeHeader103.tabs.[a].image",
      "relumeHeader103.tabs.[a].label",
    ],
  );
  assert.deepEqual(await errorPaths(hero([tab("a")])), [
    "relumeHeader103.tabs",
  ]);
  assert.deepEqual(await errorPaths(hero(["a", "b", "c", "d", "e"].map(tab))), [
    "relumeHeader103.tabs",
  ]);
});

test("a scrolling feature list needs two features with a heading and a photo", async () => {
  const layout = (features) => ({
    _type: "testHost",
    relumeLayout348: { _type: "relumeLayout348", features, theme: "light" },
  });
  const feature = (key) => ({
    _key: key,
    _type: "feature",
    heading: "Listen first",
    image: {
      _type: "image",
      asset: { _type: "reference", _ref: "image-abc-1600x900-jpg" },
    },
  });
  assert.deepEqual(await errorPaths(layout([feature("a"), feature("b")])), []);
  assert.deepEqual(
    await errorPaths(
      layout([
        { ...feature("a"), heading: " ", image: undefined },
        feature("b"),
      ]),
    ),
    [
      "relumeLayout348.features.[a].heading",
      "relumeLayout348.features.[a].image",
    ],
  );
  assert.deepEqual(await errorPaths(layout([feature("a")])), [
    "relumeLayout348.features",
  ]);
});

const sampleImage = {
  _type: "image",
  asset: { _type: "reference", _ref: "image-abc123-800x600-jpg" },
};

test("Layout 488 needs both parts of its heading, its image and its background photo", async () => {
  const layout = (headingStart, headingEnd, image) => ({
    _type: "testHost",
    relumeLayout488: {
      _type: "relumeLayout488",
      headingStart,
      headingEnd,
      image,
      backgroundImage: image,
      theme: "light",
    },
  });
  assert.deepEqual(
    await errorPaths(layout("Made to", "last", sampleImage)),
    [],
  );
  assert.deepEqual(await errorPaths(layout(" ", "", undefined)), [
    "relumeLayout488.backgroundImage",
    "relumeLayout488.headingEnd",
    "relumeLayout488.headingStart",
    "relumeLayout488.image",
  ]);
});

test("Layout 351 needs its heading and features with a label, a heading and an image", async () => {
  const layout = (heading, features) => ({
    _type: "testHost",
    relumeLayout351: {
      _type: "relumeLayout351",
      heading,
      features,
      theme: "light",
    },
  });
  const feature = {
    _key: "f",
    _type: "feature",
    label: "Planning",
    heading: "A clear plan",
    image: sampleImage,
  };
  assert.deepEqual(await errorPaths(layout("Services", [feature])), []);
  assert.deepEqual(
    await errorPaths(
      layout("Services", [
        { ...feature, label: " ", heading: "", image: undefined },
      ]),
    ),
    [
      "relumeLayout351.features.[f].heading",
      "relumeLayout351.features.[f].image",
      "relumeLayout351.features.[f].label",
    ],
  );
  assert.deepEqual(await errorPaths(layout("  ", [])), [
    "relumeLayout351.features",
    "relumeLayout351.heading",
  ]);
});

test("Layout 487 needs its heading and features with a heading and an image", async () => {
  const layout = (heading, features) => ({
    _type: "testHost",
    relumeLayout487: {
      _type: "relumeLayout487",
      heading,
      features,
      theme: "light",
    },
  });
  const feature = {
    _key: "f",
    _type: "feature",
    heading: "We listen first",
    image: sampleImage,
  };
  assert.deepEqual(await errorPaths(layout("How we work", [feature])), []);
  assert.deepEqual(
    await errorPaths(
      layout("How we work", [{ ...feature, heading: " ", image: undefined }]),
    ),
    [
      "relumeLayout487.features.[f].heading",
      "relumeLayout487.features.[f].image",
    ],
  );
  assert.deepEqual(await errorPaths(layout("  ", [])), [
    "relumeLayout487.features",
    "relumeLayout487.heading",
  ]);
});

test("an FAQ needs its heading and each question's text and answer", async () => {
  const faq = (heading, questions) => ({
    _type: "testHost",
    relumeFaq6: { _type: "relumeFaq6", heading, questions, theme: "light" },
  });
  const question = (key) => ({
    _key: key,
    _type: "question",
    title: "Where are you based?",
    answer: "In Bristol, and we work across the UK.",
  });
  assert.deepEqual(await errorPaths(faq("FAQs", [question("a")])), []);
  assert.deepEqual(
    await errorPaths(
      faq("FAQs", [{ ...question("a"), title: "  ", answer: "" }, question("b")]),
    ),
    ["relumeFaq6.questions.[a].answer", "relumeFaq6.questions.[a].title"],
  );
  assert.deepEqual(await errorPaths(faq(" ", [])), [
    "relumeFaq6.heading",
    "relumeFaq6.questions",
  ]);
});
