// Hand-finished from relume/source/layout351.tsx (Relume Layout 351), server
// half: the converter cannot carry over the features, which the original
// draws with a helper component that keeps their open state and animates a
// width. Listed under "Hand-finished blocks" in docs/agents/relume-import.md;
// do not regenerate.
import type { BlockEditing } from "@/components/blocks/relume/block-editing";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { stegaClean } from "next-sanity";
import type { BlockSceneProps } from "../block-boundaries";
import RelumeLayout351Client from "./layout351.client";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type RelumeLayout351Block = Extract<PageBlock, { _type: "relumeLayout351" }>;

export type RelumeLayout351Props = RelumeLayout351Block & {
  editing?: BlockEditing;
} & BlockSceneProps;

// The Page Builder excludes blocks without content from visible adjacency.
// Keep this rule aligned with the renderer's empty result below.
export function hasRelumeLayout351Content(
  block: Pick<RelumeLayout351Block, "heading">,
) {
  return Boolean(stegaClean(block.heading)?.trim());
}

// The features open and close in the browser, so the block is drawn by a
// Client Component. This entry stays on the server for the content rule
// above, and passes on only what can cross to the browser: `editing` in
// place of the `dataAttribute` function.
export default function RelumeLayout351({
  _key,
  bottom,
  editing,
  tagline,
  heading,
  description,
  features,
  theme,
  top,
}: RelumeLayout351Props) {
  if (!hasRelumeLayout351Content({ heading })) return null;

  return (
    <RelumeLayout351Client
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
