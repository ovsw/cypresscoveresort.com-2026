// The value logic behind the map location's pin input: a click on the aerial
// photo, or an arrow key, becomes the stored position (x and y as
// percentages of the photo, 0 to 100).

export type MapPosition = { x: number; y: number };

const clampPercent = (value: number) =>
  Math.round(Math.min(100, Math.max(0, value)) * 10) / 10;

/**
 * The position of a click on the displayed photo. `offsetX` and `offsetY`
 * are measured from the photo's top-left corner, in the same units as its
 * displayed `width` and `height`.
 */
export function positionFromClick({
  offsetX,
  offsetY,
  width,
  height,
}: {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}): MapPosition | undefined {
  if (!(width > 0) || !(height > 0)) return undefined;
  return {
    x: clampPercent((offsetX / width) * 100),
    y: clampPercent((offsetY / height) * 100),
  };
}

const ARROW_STEPS: Record<string, MapPosition> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
};

/**
 * The position after an arrow key. A pin with no position starts from the
 * photo's centre. Returns undefined for any other key.
 */
export function positionFromArrowKey(
  current: Partial<MapPosition> | undefined,
  key: string,
  step: number,
): MapPosition | undefined {
  const direction = ARROW_STEPS[key];
  if (!direction) return undefined;
  const x = typeof current?.x === "number" ? current.x : 50;
  const y = typeof current?.y === "number" ? current.y : 50;
  return {
    x: clampPercent(x + direction.x * step),
    y: clampPercent(y + direction.y * step),
  };
}
