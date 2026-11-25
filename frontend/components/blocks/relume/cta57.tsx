// Hand-finished from relume/source/cta57.tsx (Relume CTA 57), server half:
// its heading is a list of lines, each sliding in from alternating sides,
// which the converter cannot model. Listed under "Hand-finished blocks" in
// docs/agents/relume-import.md; do not regenerate.
import type { BlockEditing } from "@/components/blocks/relume/block-editing";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { stegaClean } from "next-sanity";
import type { BlockSceneProps } from "../block-boundaries";
import RelumeCta57Client from "./cta57.client";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type RelumeCta57Block = Extract<PageBlock, { _type: "relumeCta57" }>;

export type RelumeCta57Props = RelumeCta57Block & {
  editing?: BlockEditing;
} & BlockSceneProps;

/** The heading lines that hold text; Studio requires one at least. */
export function relumeCta57HeadingLines(lines?: (string | null)[] | null) {
  return (lines ?? []).filter((line): line is string =>
    Boolean(stegaClean(line)?.trim()),
  );
}

// The Page Builder excludes blocks without content from visible adjacency.
// Keep this rule aligned with the renderer's empty result below.
export function hasRelumeCta57Content(
  block: Pick<RelumeCta57Block, "headingLines">,
) {
  return relumeCta57HeadingLines(block.headingLines).length > 0;
}

// The block animates in the browser, so it is drawn by a Client Component.
// This entry stays on the server for the content rule above, and passes on
// only what can cross to the browser: `editing` in place of the
// `dataAttribute` function.
export default function RelumeCta57({
  _key,
  bottom,
  editing,
  headingLines,
  description,
  buttons,
  theme,
  top,
}: RelumeCta57Props) {
  if (!hasRelumeCta57Content({ headingLines })) return null;

  return (
    <RelumeCta57Client
      _key={_key}
      bottom={bottom}
      editing={editing}
      headingLines={relumeCta57HeadingLines(headingLines)}
      description={description}
      buttons={buttons}
      theme={theme}
      top={top}
    />
  );
}
