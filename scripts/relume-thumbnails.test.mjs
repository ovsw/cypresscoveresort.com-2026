import assert from "node:assert/strict";
import test from "node:test";

import {
  blockPagePath,
  parseArgs,
  PREVIEW_MARKER,
  withPreviewTypes,
} from "./relume/thumbnails.mjs";

const source = [
  "const previewBlockTypes = new Set<string>([",
  '  "richTextBlock",',
  PREVIEW_MARKER,
  "]);",
  "",
].join("\n");

test("thumbnails register above the marker, in the generator's line format", () => {
  assert.equal(
    withPreviewTypes(source, ["relumeCta57", "relumeFaq6"]),
    [
      "const previewBlockTypes = new Set<string>([",
      '  "richTextBlock",',
      '  "relumeCta57",',
      '  "relumeFaq6",',
      PREVIEW_MARKER,
      "]);",
      "",
    ].join("\n"),
  );
});

test("a thumbnail already registered is not registered twice", () => {
  const once = withPreviewTypes(source, ["relumeCta57"]);
  assert.equal(withPreviewTypes(once, ["relumeCta57"]), once);
});

test("a page-builder.ts without the marker is refused", () => {
  assert.throws(() => withPreviewTypes("const previewBlockTypes = [];", ["x"]), /marker/);
});

test("a block's thumbnail comes from its Light Block library page", () => {
  assert.equal(
    blockPagePath({ category: "hero-header-sections", name: "Header 83" }),
    "/block-library/heroes/header-83",
  );
  assert.equal(
    blockPagePath({ category: "cta-sections", name: "CTA 57" }),
    "/block-library/calls-to-action/cta-57",
  );
});

test("arguments are slugs; options are refused", () => {
  assert.deepEqual(parseArgs([]), { slugs: [] });
  assert.deepEqual(parseArgs(["header83", "cta57"]), { slugs: ["header83", "cta57"] });
  assert.throws(() => parseArgs(["--all"]), /Unexpected option/);
});
