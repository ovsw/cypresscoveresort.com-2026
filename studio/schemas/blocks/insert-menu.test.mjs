// The Page blocks insert menu ("Add item…") opens in grid view, grouped by
// kind, with a thumbnail on every block. This test fails when a registered
// block has no group, no registered thumbnail, or a registered thumbnail
// that is missing from studio/static/images/preview/. A Relume block gets
// its thumbnail from the shelf (`pnpm relume:add`); one captured in the
// Starter comes from `pnpm relume:thumbnails <slug>`.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

import {
  blocksField,
  contentBlocksField,
  contentPageBuilderBlockTypes,
  generalPageBuilderBlockTypes,
  getInsertMenuGroups,
  getInsertMenuGroupTitle,
  getPageBuilderPreviewImageUrl,
  homePageBlocksField,
  homePagePageBuilderBlockTypes,
} from "./page-builder.ts";

const blockTypes = [
  ...new Set([
    ...contentPageBuilderBlockTypes,
    ...generalPageBuilderBlockTypes,
    ...homePagePageBuilderBlockTypes,
  ]),
];
const fields = { blocksField, contentBlocksField, homePageBlocksField };

test("a Relume block's group is the word before its number; others are Basic", () => {
  assert.equal(getInsertMenuGroupTitle("relumeLayout488"), "Layout");
  assert.equal(getInsertMenuGroupTitle("relumeHeader83"), "Header");
  assert.equal(getInsertMenuGroupTitle("relumeCta57"), "CTA");
  assert.equal(getInsertMenuGroupTitle("relumeFaq6"), "FAQ");
  assert.equal(getInsertMenuGroupTitle("relumeBlogPost12"), "Blog Post");
  assert.equal(getInsertMenuGroupTitle("richTextBlock"), "Basic");
  assert.equal(getInsertMenuGroupTitle("scaffold"), "Basic");
});

test("every Page blocks field puts each of its blocks in exactly one group", () => {
  for (const [name, field] of Object.entries(fields)) {
    const { groups } = field.options.insertMenu;
    const grouped = groups.flatMap((group) => group.of);
    const types = field.of.map((member) => member.type);
    assert.deepEqual([...grouped].sort(), [...types].sort(), name);
    assert.equal(new Set(groups.map((group) => group.name)).size, groups.length, name);
  }
  assert.ok(
    getInsertMenuGroups(blockTypes).every((group) => group.of.length > 0 && group.title),
  );
});

test("every Page blocks field opens its insert menu in grid view", () => {
  for (const [name, field] of Object.entries(fields)) {
    const { views } = field.options.insertMenu;
    assert.equal(views[0].name, "grid", name);
    assert.equal(views[0].previewImageUrl, getPageBuilderPreviewImageUrl, name);
  }
});

test("every block has a registered thumbnail that exists on disk", () => {
  assert.deepEqual(
    blockTypes.filter((type) => !getPageBuilderPreviewImageUrl(type)),
    [],
    "Register these blocks' thumbnails in previewBlockTypes in page-builder.ts.",
  );
  assert.deepEqual(
    blockTypes.filter(
      (type) =>
        !existsSync(new URL(`../../static/images/preview/${type}.jpg`, import.meta.url)),
    ),
    [],
    "Add these thumbnails to studio/static/images/preview/ (pnpm relume:thumbnails for a Relume block).",
  );
});
