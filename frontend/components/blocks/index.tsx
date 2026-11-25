import { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { type LivePerspective } from "next-sanity/live";
import { createDataAttribute, stegaClean } from "next-sanity";
import RichTextBlock from "@/components/blocks/rich-text-block";
import {
  resolveBlockBands,
  resolveBlockBoundaries,
  type BlockBand,
  type BlockEdgeTreatment,
} from "@/components/blocks/block-boundaries";
import Scaffold, { hasScaffoldContent } from "@/components/blocks/scaffold";
import {
  blockDataAttribute,
  type BlockEditing,
} from "@/components/blocks/relume/block-editing";
import RelumeHeader103, { hasRelumeHeader103Content } from "@/components/blocks/relume/header103";
import RelumeLayout488, { hasRelumeLayout488Content } from "@/components/blocks/relume/layout488";
import RelumeLayout348, { hasRelumeLayout348Content } from "@/components/blocks/relume/layout348";
import RelumeTestimonial18, { hasRelumeTestimonial18Content } from "@/components/blocks/relume/testimonial18";
import RelumeGallery24, { hasRelumeGallery24Content } from "@/components/blocks/relume/gallery24";
import RelumeEvent9, { hasRelumeEvent9Content } from "@/components/blocks/relume/event9";
import RelumeCta57, { hasRelumeCta57Content } from "@/components/blocks/relume/cta57";
import RelumeLayout422, { hasRelumeLayout422Content } from "@/components/blocks/relume/layout422";
import RelumeLayout351, { hasRelumeLayout351Content } from "@/components/blocks/relume/layout351";
import RelumeLayout487, { hasRelumeLayout487Content } from "@/components/blocks/relume/layout487";
import RelumeFaq6, { hasRelumeFaq6Content } from "@/components/blocks/relume/faq6";
import RelumeHeader83, { hasRelumeHeader83Content } from "@/components/blocks/relume/header83";
// page-builder-generator:component-imports
import { isHeroBlockType } from "@/components/blocks/hero";
import { dataset, projectId } from "@/sanity/lib/env";

type Block =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type BlockEditingProps = {
  dataAttribute?: (path: string) => string | undefined;
  // The same targets as plain data, for a block that is a Client
  // Component: a function cannot be passed to one.
  editing?: BlockEditing;
};

const serverFieldEditingBlockTypes = new Set<Block["_type"]>([
  "richTextBlock",
  "scaffold",
  "relumeHeader103",
  "relumeLayout488",
  "relumeLayout348",
  "relumeTestimonial18",
  "relumeGallery24",
  "relumeEvent9",
  "relumeCta57",
  "relumeLayout422",
  "relumeLayout351",
  "relumeLayout487",
  "relumeFaq6",
  "relumeHeader83",
  // page-builder-generator:editing-types
]);

const componentMap: Partial<{
  [K in Block["_type"]]: React.ComponentType<
    Extract<Block, { _type: K }> & BlockEditingProps
  >;
}> = {
  richTextBlock: RichTextBlock,
  scaffold: Scaffold,
  relumeHeader103: RelumeHeader103,
  relumeLayout488: RelumeLayout488,
  relumeLayout348: RelumeLayout348,
  relumeTestimonial18: RelumeTestimonial18,
  relumeGallery24: RelumeGallery24,
  relumeEvent9: RelumeEvent9,
  relumeCta57: RelumeCta57,
  relumeLayout422: RelumeLayout422,
  relumeLayout351: RelumeLayout351,
  relumeLayout487: RelumeLayout487,
  relumeFaq6: RelumeFaq6,
  relumeHeader83: RelumeHeader83,
  // page-builder-generator:component-map
};

// Code owns irregular top edges. A block listed here overlaps the block
// above it at a different-background join; the renderer must pass
// `topTreatment` to `blockSceneClassName`. The Starter registers none.
const blockEdgeTreatments: Partial<Record<Block["_type"], BlockEdgeTreatment>> =
  {};

/** True when this site has a renderer registered for the block `_type`. */
export function isRegisteredBlockType(type: string) {
  return Object.hasOwn(componentMap, type);
}

function isVisibleBlock(block: Block) {
  return Boolean(componentMap[block._type]) && isRenderableBlock(block);
}

/**
 * A page has one <h1>. When its first visible block is a hero, the hero's
 * heading is that <h1> and the page leaves out its own title heading;
 * otherwise the title heading is the <h1> and every hero starts at <h2>.
 */
export function leadsWithHero(blocks: Block[]) {
  const first = blocks.find(isVisibleBlock);
  return Boolean(first && isHeroBlockType(first._type));
}

export default function Blocks({
  blocks,
  documentId,
  documentType = "page",
  heroLeads = false,
  stega,
}: {
  blocks: Block[];
  documentId: string;
  documentType?: "blogIndex" | "homePage" | "page";
  /** `leadsWithHero(blocks)`, when nothing on the page comes before them. */
  heroLeads?: boolean;
  perspective: LivePerspective;
  stega: boolean;
}) {
  const leadKey = heroLeads ? blocks.find(isVisibleBlock)?._key : undefined;
  const visibleBlocks = blocks.flatMap((block) => {
    if (!isVisibleBlock(block)) return [];
    return [
      {
        key: block._key,
        theme: "theme" in block ? (block.theme as string | null) : null,
        edgeTreatment: blockEdgeTreatments[block._type] ?? "none",
      },
    ];
  });
  const resolvedBoundaries = resolveBlockBoundaries(visibleBlocks);

  // A band is a run of visible blocks joined by seams: one continuous
  // surface. The stylesheet paints surface texture on the band, so the
  // texture does not restart at every seam. A block that renders nothing
  // stays inside the band around it; a leading one gets a plain wrapper.
  const bandStarts = new Map(
    resolveBlockBands(resolvedBoundaries).map((band) => [band.keys[0], band]),
  );
  const groups: { band?: BlockBand; blocks: Block[] }[] = [];
  for (const block of blocks) {
    const band = bandStarts.get(block._key);
    if (band || groups.length === 0) groups.push({ band, blocks: [] });
    groups[groups.length - 1].blocks.push(block);
  }

  function renderBlock(block: Block) {
    const Component = componentMap[block._type] as
      React.ComponentType<Block & BlockEditingProps> | undefined;
    if (!Component) return null;

    const blockPath = `blocks[_key=="${block._key}"]`;
    const dataSanity = stega
      ? createDataAttribute({
          baseUrl:
            process.env.NEXT_PUBLIC_STUDIO_URL || "http://localhost:3333",
          dataset,
          id: documentId,
          path: blockPath,
          projectId,
          type: documentType,
        }).toString()
      : undefined;
    const editing: BlockEditing | undefined = stega
      ? {
          baseUrl:
            process.env.NEXT_PUBLIC_STUDIO_URL || "http://localhost:3333",
          dataset,
          id: documentId,
          path: blockPath,
          projectId,
          type: documentType,
        }
      : undefined;
    const dataAttribute = blockDataAttribute(editing);
    const editingProps: BlockEditingProps = serverFieldEditingBlockTypes.has(
      block._type,
    )
      ? { dataAttribute, editing }
      : {};
    // The boundary's `key` names its block. React forbids a `key` inside
    // spread props, so only the scene props go to the block.
    const boundary = resolvedBoundaries.find(({ key }) => key === block._key);
    const sceneProps = boundary && {
      bottom: boundary.bottom,
      theme: boundary.theme,
      top: boundary.top,
      topTreatment: boundary.topTreatment,
      topTuck: boundary.topTuck,
      ...(block._key === leadKey ? { leadsPage: true } : {}),
    };

    return (
      // scripts/verify-no-skeleton.mjs reads `data-block-key` to find a
      // published block that drew nothing.
      <div
        data-sanity={dataSanity}
        data-block-key={block._key}
        key={block._key}
      >
        <Component {...block} {...editingProps} {...sceneProps} />
      </div>
    );
  }

  return (
    <>
      {groups.map(({ band, blocks: bandBlocks }) => (
        <div
          data-band={band?.theme ?? undefined}
          data-band-tuck={band?.tuck ? "" : undefined}
          key={bandBlocks[0]._key}
        >
          {bandBlocks.map(renderBlock)}
        </div>
      ))}
    </>
  );
}

// Blocks that render nothing must not create joins. Keep each rule aligned
// with the renderer's own empty result.
function isRenderableBlock(block: Block) {
  if (block._type === "richTextBlock") {
    return Boolean(
      stegaClean(block.eyebrow)?.trim() ||
        stegaClean(block.title)?.trim() ||
        block.richText?.length,
    );
  }
  if (block._type === "scaffold") return hasScaffoldContent(block);
  if (block._type === "relumeHeader103") return hasRelumeHeader103Content(block);
  if (block._type === "relumeLayout488") return hasRelumeLayout488Content(block);
  if (block._type === "relumeLayout348") return hasRelumeLayout348Content(block);
  if (block._type === "relumeTestimonial18") return hasRelumeTestimonial18Content(block);
  if (block._type === "relumeGallery24") return hasRelumeGallery24Content(block);
  if (block._type === "relumeEvent9") return hasRelumeEvent9Content(block);
  if (block._type === "relumeCta57") return hasRelumeCta57Content(block);
  if (block._type === "relumeLayout422") return hasRelumeLayout422Content(block);
  if (block._type === "relumeLayout351") return hasRelumeLayout351Content(block);
  if (block._type === "relumeLayout487") return hasRelumeLayout487Content(block);
  if (block._type === "relumeFaq6") return hasRelumeFaq6Content(block);
  if (block._type === "relumeHeader83") return hasRelumeHeader83Content(block);
  // page-builder-generator:visible-blocks
  return true;
}
