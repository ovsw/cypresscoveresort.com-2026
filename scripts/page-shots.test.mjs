import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { assertDraftBlocks, parseArgs, removeBlockShots } from "./page-shots.mjs";

test("page shots parses nested slugs and options in either order", () => {
  assert.deepEqual(parseArgs(["--only", "phone", "/about/team/", "--out", "/tmp/review"]), {
    only: "phone", slug: "about/team", out: "/tmp/review",
  });
});

test("page shots rejects missing and unsupported arguments", () => {
  for (const args of [[], ["/"], ["about", "--out"], ["about", "--only", "tablet"], ["about", "extra"], ["--bad"]]) {
    assert.throws(() => parseArgs(args));
  }
});

test("published mode cannot pass even with the same block keys", () => {
  assert.throws(() => assertDraftBlocks(["a"], ["a"], false, "drafts.page"), /draft mode is off/);
});

test("missing, extra, reordered and empty blocks stop screenshots", () => {
  for (const rendered of [[], ["a"], ["b", "a"], ["a", "b", "c"]]) {
    assert.throws(() => assertDraftBlocks(["a", "b"], rendered, true, "drafts.page"), /Refusing screenshots/);
  }
  assert.throws(() => assertDraftBlocks([], [], true, "drafts.page"));
  assert.doesNotThrow(() => assertDraftBlocks(["a", "b"], ["a", "b"], true, "drafts.page"));
});

test("a new capture removes earlier block images and keeps other files", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "page-shots-"));
  try {
    for (const file of ["01-hero.png", "02-old.png", "100-last.png", "notes.png", "readme.txt"]) {
      writeFileSync(path.join(directory, file), "");
    }
    removeBlockShots(directory);
    assert.deepEqual(readdirSync(directory).sort(), ["notes.png", "readme.txt"]);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
