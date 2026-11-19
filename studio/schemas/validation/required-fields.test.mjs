// Runs Studio's own validation on documents, with the Studio's real schema
// types, to check that a Section cannot publish without a field it needs to
// draw. See "A Section never hides silently" in docs/agents/page-builder.md.
import assert from "node:assert/strict";
import test from "node:test";
import {
  createSchema,
  createValidator,
  schemaTypes,
} from "./studio-validation.mjs";

// A test-only document that holds the shared objects and Sections, so each
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
      ],
    },
  ],
});

const { errors, errorPaths } = createValidator(schema);

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

test("a rich text Section needs content", async () => {
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
