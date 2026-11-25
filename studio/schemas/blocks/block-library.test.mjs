// The "Block library" list in docs/content-model.md is the text version of
// the Page Builder catalogue that content-editing agents are given. This test
// fails when it names different blocks than the scope lists in
// page-builder.ts. It cannot tell whether an entry's text is still true.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  contentPageBuilderBlockTypes,
  generalPageBuilderBlockTypes,
  homePagePageBuilderBlockTypes,
} from "./page-builder.ts";

export function listedBlockTypes(markdown) {
  const start = markdown.search(/^## Block library\s*$/m);
  assert.notEqual(start, -1, 'docs/content-model.md has no "## Block library" heading.');
  const rest = markdown.slice(start).replace(/^.*\n/, "");
  const end = rest.search(/^## /m);
  const body = end === -1 ? rest : rest.slice(0, end);
  return [...body.matchAll(/^- `([^`]+)`/gm)].map((match) => match[1]);
}

const blockTypes = [
  ...new Set([
    ...contentPageBuilderBlockTypes,
    ...generalPageBuilderBlockTypes,
    ...homePagePageBuilderBlockTypes,
  ]),
];
const listed = listedBlockTypes(
  readFileSync(new URL("../../../docs/content-model.md", import.meta.url), "utf8"),
);

test("every Page Builder block is in the Block library list", () => {
  assert.deepEqual(
    blockTypes.filter((type) => !listed.includes(type)),
    [],
    'Add these blocks to "Block library" in docs/content-model.md.',
  );
});

test("the Block library list names only existing blocks, once each", () => {
  assert.deepEqual(
    listed.filter((type) => !blockTypes.includes(type)),
    [],
    'Remove these entries from "Block library" in docs/content-model.md, or fix the name.',
  );
  assert.deepEqual(
    listed.filter((type, index) => listed.indexOf(type) !== index),
    [],
    "These blocks are listed more than once.",
  );
});

test("the list parser reads only entries under the Block library heading", () => {
  const markdown = [
    "## Other",
    "- `notABlock` text",
    "## Block library",
    "Intro with `inlineCode`.",
    "- `heroBlock` (Hero). Text.",
    "  continued `nested` line",
    "- `faqBlock` text",
    "## Next",
    "- `alsoNot` text",
  ].join("\n");
  assert.deepEqual(listedBlockTypes(markdown), ["heroBlock", "faqBlock"]);
});
