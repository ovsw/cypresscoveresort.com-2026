// Hand-finished from relume/source/layout422.tsx (Relume Layout 422), server
// half: the converter cannot carry over the panels, which Relume opens with
// `AnimatePresence` and a `height` animation, and which it links with a plain
// string beside an unlabelled button. Here each panel links to its one
// button's destination and the panels open in layout422.client.tsx. Listed
// under "Hand-finished blocks" in docs/agents/relume-import.md; do not
// regenerate.
import type { BlockEditing } from "@/components/blocks/relume/block-editing";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { stegaClean } from "next-sanity";
import type { BlockSceneProps } from "../block-boundaries";
import RelumeLayout422Client from "./layout422.client";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type RelumeLayout422Block = Extract<PageBlock, { _type: "relumeLayout422" }>;

export type RelumeLayout422Props = RelumeLayout422Block & {
  editing?: BlockEditing;
} & BlockSceneProps;

// The Page Builder excludes blocks without content from visible adjacency.
// Keep this rule aligned with the renderer's empty result below.
export function hasRelumeLayout422Content(
  block: Pick<RelumeLayout422Block, "heading">,
) {
  return Boolean(stegaClean(block.heading)?.trim());
}

// The panels open in the browser, so the block is drawn by a Client
// Component. This entry stays on the server for the content rule above, and
// passes on only what can cross to the browser: `editing` in place of the
// `dataAttribute` function.
export default function RelumeLayout422({
  _key,
  bottom,
  editing,
  tagline,
  heading,
  description,
  features,
  theme,
  top,
}: RelumeLayout422Props) {
  if (!hasRelumeLayout422Content({ heading })) return null;

  return (
    <RelumeLayout422Client
      _key={_key}
      bottom={bottom}
      description={description}
      editing={editing}
      features={features}
      heading={heading}
      tagline={tagline}
      theme={theme}
      top={top}
    />
  );
}
