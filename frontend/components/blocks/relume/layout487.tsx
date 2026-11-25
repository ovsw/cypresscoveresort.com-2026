// Hand-finished from relume/source/layout487.tsx (Relume Layout 487), server
// half: the converter cannot carry over the features, which the original
// draws with a helper component that follows the scroll and swaps the pinned
// photo by its index. Listed under "Hand-finished blocks" in docs/agents/relume-import.md;
// do not regenerate.
import type { BlockEditing } from "@/components/blocks/relume/block-editing";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { stegaClean } from "next-sanity";
import type { BlockSceneProps } from "../block-boundaries";
import RelumeLayout487Client from "./layout487.client";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type RelumeLayout487Block = Extract<PageBlock, { _type: "relumeLayout487" }>;

export type RelumeLayout487Props = RelumeLayout487Block & {
  editing?: BlockEditing;
} & BlockSceneProps;

// The Page Builder excludes blocks without content from visible adjacency.
// Keep this rule aligned with the renderer's empty result below.
export function hasRelumeLayout487Content(
  block: Pick<RelumeLayout487Block, "heading">,
) {
  return Boolean(stegaClean(block.heading)?.trim());
}

// The features follow the scroll in the browser, so the block is drawn by a
// Client Component. This entry stays on the server for the content rule
// above, and passes on only what can cross to the browser: `editing` in
// place of the `dataAttribute` function.
export default function RelumeLayout487({
  _key,
  bottom,
  editing,
  tagline,
  heading,
  description,
  features,
  theme,
  top,
}: RelumeLayout487Props) {
  if (!hasRelumeLayout487Content({ heading })) return null;

  return (
    <RelumeLayout487Client
      _key={_key}
      bottom={bottom}
      editing={editing}
      tagline={tagline}
      heading={heading}
      description={description}
      features={features}
      theme={theme}
      top={top}
    />
  );
}
