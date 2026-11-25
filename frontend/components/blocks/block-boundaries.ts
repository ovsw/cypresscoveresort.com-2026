import { cn } from "@/lib/utils";
import { stegaClean } from "next-sanity";

export type BlockTheme = "light" | "dark";
export type BlockBoundary = "outer" | "seam" | "edge";
export type BlockEdgeTreatment = "none" | "wave";
export type BlockSceneProps = {
  theme?: string | null;
  top?: BlockBoundary;
  bottom?: BlockBoundary;
  topTreatment?: BlockEdgeTreatment;
  /**
   * The block is the first thing on the page, with no title heading above
   * it. A hero then draws the page's <h1>; anywhere else it starts at <h2>.
   */
  leadsPage?: boolean;
};

export type BlockDescriptor = {
  key: string;
  theme?: string | null;
  edgeTreatment?: BlockEdgeTreatment;
};

export type ResolvedBlockBoundary = {
  key: string;
  theme: BlockTheme | null;
  top: BlockBoundary;
  bottom: BlockBoundary;
  topTreatment: BlockEdgeTreatment;
  topTuck: boolean;
};

export function resolveBlockTheme(value: string | null | undefined): BlockTheme {
  return stegaClean(value) === "dark" ? "dark" : "light";
}

export function resolveBlockBoundaries(
  blocks: BlockDescriptor[],
): ResolvedBlockBoundary[] {
  return blocks.map((block, index) => {
    const previous = blocks[index - 1];
    const next = blocks[index + 1];
    return {
      key: block.key,
      theme: block.theme == null ? null : resolveBlockTheme(block.theme),
      top: previous ? resolveJoin(previous, block) : "outer",
      bottom: next ? resolveJoin(block, next) : "outer",
      topTreatment: previous
        ? resolveTreatment(previous, block)
        : "none",
      topTuck: Boolean(previous && resolveTreatment(previous, block) !== "none"),
    };
  });
}

function resolveTreatment(
  upper: BlockDescriptor,
  lower: BlockDescriptor,
): BlockEdgeTreatment {
  return resolveJoin(upper, lower) === "edge"
    ? (lower.edgeTreatment ?? "none")
    : "none";
}

function resolveJoin(upper: BlockDescriptor, lower: BlockDescriptor): BlockBoundary {
  // A block without a theme, such as a Scaffold, never shares a surface.
  if (!upper.theme || !lower.theme) return "edge";
  return resolveBlockTheme(upper.theme) === resolveBlockTheme(lower.theme)
    ? "seam"
    : "edge";
}

export function blockSceneClassName(
  theme: BlockTheme,
  top: BlockBoundary,
  bottom: BlockBoundary,
  topTreatment: BlockEdgeTreatment = "none",
) {
  return cn(
    "block-scene",
    theme === "dark" ? "block-scene-dark" : "block-scene-light",
    top === "seam" ? "block-scene-seam-top" : "block-scene-edge-top",
    bottom === "seam"
      ? "block-scene-seam-bottom"
      : "block-scene-edge-bottom",
    topTreatment === "wave" ? "block-scene-wave-top" : undefined,
  );
}

export type BlockBand = {
  /** Keys of the blocks in the band, in page order. */
  keys: string[];
  theme: BlockTheme | null;
  /** The first block tucks over the block above, so the band's top follows its shape. */
  tuck: boolean;
};

/**
 * Groups consecutive blocks joined by seams into bands. Blocks in one
 * band share a theme and read as one continuous surface, so the stylesheet
 * paints surface texture once per band instead of once per block. An
 * outer or edge boundary always starts a new band.
 */
export function resolveBlockBands(
  boundaries: ResolvedBlockBoundary[],
): BlockBand[] {
  const bands: BlockBand[] = [];
  for (const boundary of boundaries) {
    const current = bands[bands.length - 1];
    if (current && boundary.top === "seam") {
      current.keys.push(boundary.key);
      continue;
    }
    bands.push({ keys: [boundary.key], theme: boundary.theme, tuck: boundary.topTuck });
  }
  return bands;
}
