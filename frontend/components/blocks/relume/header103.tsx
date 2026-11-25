// Hand-finished from relume/source/header103.tsx (Relume Header 103), server
// half: a full-screen hero of two to four tabs, each with its own photo,
// heading and buttons. The tabs move on by themselves, so the block is drawn
// in the browser (header103.client.tsx); this entry stays on the server for
// the content rule. Listed under "Hand-finished blocks" in
// docs/agents/relume-import.md; do not regenerate.
import type { BlockEditing } from "@/components/blocks/relume/block-editing";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { stegaClean } from "next-sanity";
import type { BlockSceneProps } from "../block-boundaries";
import RelumeHeader103Client from "./header103.client";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type RelumeHeader103Block = Extract<PageBlock, { _type: "relumeHeader103" }>;

export type RelumeHeader103Tab = NonNullable<
  RelumeHeader103Block["tabs"]
>[number];

export type RelumeHeader103Props = RelumeHeader103Block & {
  editing?: BlockEditing;
} & BlockSceneProps;

/** A tab is drawn only with its label and heading, both required in Studio. */
export function isRelumeHeader103Tab(tab: RelumeHeader103Tab) {
  return Boolean(
    stegaClean(tab.label)?.trim() && stegaClean(tab.heading)?.trim(),
  );
}

// The Page Builder excludes blocks without content from visible adjacency.
// Keep this rule aligned with the renderer's empty result below.
export function hasRelumeHeader103Content(
  block: Pick<RelumeHeader103Block, "tabs">,
) {
  return Boolean(block.tabs?.some(isRelumeHeader103Tab));
}

// The block runs in the browser, so it is drawn by a Client Component.
// This entry stays on the server for the content rule above, and passes on
// only what can cross to the browser: `editing` in place of the
// `dataAttribute` function.
export default function RelumeHeader103({
  _key,
  bottom,
  editing,
  tabs,
  leadsPage,
  theme,
  top,
}: RelumeHeader103Props) {
  if (!hasRelumeHeader103Content({ tabs })) return null;

  return (
    <RelumeHeader103Client
      _key={_key}
      bottom={bottom}
      editing={editing}
      tabs={(tabs ?? []).filter(isRelumeHeader103Tab)}
      leadsPage={leadsPage}
      theme={theme}
      top={top}
    />
  );
}
