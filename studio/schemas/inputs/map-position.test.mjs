import assert from "node:assert/strict";
import test from "node:test";

import { positionFromArrowKey, positionFromClick } from "./map-position.ts";

test("a click becomes percentages of the displayed photo", () => {
  assert.deepEqual(
    positionFromClick({ offsetX: 200, offsetY: 75, width: 800, height: 300 }),
    { x: 25, y: 25 },
  );
  assert.deepEqual(
    positionFromClick({ offsetX: 333, offsetY: 100, width: 1000, height: 300 }),
    { x: 33.3, y: 33.3 },
  );
});

test("a click outside the photo is clamped to 0 to 100", () => {
  assert.deepEqual(
    positionFromClick({ offsetX: -10, offsetY: 400, width: 800, height: 300 }),
    { x: 0, y: 100 },
  );
});

test("a photo with no displayed size gives no position", () => {
  assert.equal(
    positionFromClick({ offsetX: 10, offsetY: 10, width: 0, height: 300 }),
    undefined,
  );
});

test("arrow keys move the pin and stay inside the photo", () => {
  assert.deepEqual(positionFromArrowKey({ x: 10, y: 10 }, "ArrowRight", 1), {
    x: 11,
    y: 10,
  });
  assert.deepEqual(positionFromArrowKey({ x: 0.4, y: 99 }, "ArrowLeft", 1), {
    x: 0,
    y: 99,
  });
  assert.deepEqual(positionFromArrowKey({ x: 50, y: 98 }, "ArrowDown", 5), {
    x: 50,
    y: 100,
  });
  assert.deepEqual(positionFromArrowKey(undefined, "ArrowUp", 1), {
    x: 50,
    y: 49,
  });
  assert.equal(positionFromArrowKey({ x: 1, y: 1 }, "Enter", 1), undefined);
});
