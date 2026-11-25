// Hand-finished from relume/source/layout348.tsx (Relume Layout 348), server
// half: features that scroll past a pinned photo. The block watches the
// scroll, so it is drawn in the browser (layout348.client.tsx); this entry
// stays on the server for the content rule. Listed under "Hand-finished
// blocks" in docs/agents/relume-import.md; do not regenerate.
import type { BlockEditing } from "@/components/blocks/relume/block-editing";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { stegaClean } from "next-sanity";
import type { BlockSceneProps } from "../block-boundaries";
import RelumeLayout348Client from "./layout348.client";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type RelumeLayout348Block = Extract<PageBlock, { _type: "relumeLayout348" }>;

type RelumeLayout348Feature = NonNullable<
  RelumeLayout348Block["features"]
>[number];

export type RelumeLayout348Props = RelumeLayout348Block & {
  editing?: BlockEditing;
} & BlockSceneProps;

/** A feature is drawn only with its heading, which Studio requires. */
function isRelumeLayout348Feature(feature: RelumeLayout348Feature) {
  return Boolean(stegaClean(feature.heading)?.trim());
}

// The Page Builder excludes blocks without content from visible adjacency.
// Keep this rule aligned with the renderer's empty result below.
export function hasRelumeLayout348Content(
  block: Pick<RelumeLayout348Block, "features">,
) {
  return Boolean(block.features?.some(isRelumeLayout348Feature));
}

// The block runs in the browser, so it is drawn by a Client Component.
// This entry stays on the server for the content rule above, and passes on
// only what can cross to the browser: `editing` in place of the
// `dataAttribute` function.
export default function RelumeLayout348({
  _key,
  bottom,
  editing,
  features,
  theme,
  top,
}: RelumeLayout348Props) {
  if (!hasRelumeLayout348Content({ features })) return null;

  return (
    <RelumeLayout348Client
      _key={_key}
      bottom={bottom}
      editing={editing}
      features={(features ?? []).filter(isRelumeLayout348Feature)}
      theme={theme}
      top={top}
    />
  );
}
