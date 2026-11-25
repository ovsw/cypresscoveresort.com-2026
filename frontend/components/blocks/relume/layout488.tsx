// Hand-finished from relume/source/layout488.tsx (Relume Layout 488), server
// half: the converter cannot hold the circle that widens behind the photo
// still for reduced motion, nor stack the two sliding halves of the heading.
// Listed under "Hand-finished blocks" in docs/agents/relume-import.md; do not
// regenerate.
import type { BlockEditing } from "@/components/blocks/relume/block-editing";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { stegaClean } from "next-sanity";
import type { BlockSceneProps } from "../block-boundaries";
import RelumeLayout488Client from "./layout488.client";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type RelumeLayout488Block = Extract<PageBlock, { _type: "relumeLayout488" }>;

export type RelumeLayout488Props = RelumeLayout488Block & {
  editing?: BlockEditing;
} & BlockSceneProps;

// The Page Builder excludes blocks without content from visible adjacency.
// Keep this rule aligned with the renderer's empty result below.
export function hasRelumeLayout488Content(
  block: Pick<RelumeLayout488Block, "headingStart" | "headingEnd">,
) {
  return Boolean(
    stegaClean(block.headingStart)?.trim() &&
      stegaClean(block.headingEnd)?.trim(),
  );
}

// The block runs in the browser, so it is drawn by a Client Component.
// This entry stays on the server for the content rule above, and passes on
// only what can cross to the browser: `editing` in place of the
// `dataAttribute` function.
export default function RelumeLayout488({
  _key,
  bottom,
  editing,
  headingStart,
  image,
  headingEnd,
  backgroundImage,
  theme,
  top,
}: RelumeLayout488Props) {
  if (!hasRelumeLayout488Content({ headingStart, headingEnd })) return null;

  return (
    <RelumeLayout488Client
      _key={_key}
      bottom={bottom}
      editing={editing}
      headingStart={headingStart}
      image={image}
      headingEnd={headingEnd}
      backgroundImage={backgroundImage}
      theme={theme}
      top={top}
    />
  );
}
