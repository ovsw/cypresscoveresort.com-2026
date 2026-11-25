import { defineField } from "sanity";

export const contentPageBuilderBlockTypes = [
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
  // page-builder-generator:content-types
] as const;

const generalOnlyPageBuilderBlockTypes = [
  // page-builder-generator:general-types
] as const;

const homeOnlyPageBuilderBlockTypes = [
  // page-builder-generator:home-types
] as const;

export const generalPageBuilderBlockTypes = [
  ...generalOnlyPageBuilderBlockTypes,
  ...contentPageBuilderBlockTypes,
] as const;

export const pageBuilderBlockTypes = generalPageBuilderBlockTypes;
export const homePagePageBuilderBlockTypes = [
  ...homeOnlyPageBuilderBlockTypes,
  ...contentPageBuilderBlockTypes,
] as const;

type PageBuilderBlockType =
  | (typeof generalPageBuilderBlockTypes)[number]
  | (typeof homePagePageBuilderBlockTypes)[number];

const previewBlockTypes = new Set<string>([
  // page-builder-generator:preview-types
]);

export function getPageBuilderPreviewImageUrl(schemaTypeName: string) {
  return previewBlockTypes.has(schemaTypeName)
    ? `/static/images/preview/${schemaTypeName}.jpg`
    : undefined;
}

function createBlocksField(blockTypes: readonly PageBuilderBlockType[]) {
  return defineField({
    name: "blocks",
    title: "Page blocks",
    type: "array",
    group: "content",
    of: blockTypes.map((type) => ({ type })),
    options: {
      insertMenu: {
        views: [
          { name: "list" },
          { name: "grid", previewImageUrl: getPageBuilderPreviewImageUrl },
        ],
      },
    },
  });
}

// Replaced Scaffolds move here. The archive accepts the same block types as
// `blocks`, so a block can move back without losing data. The Website never
// queries or renders it.
export const blocksArchiveFieldset = {
  name: "blocksArchive",
  title: "Archived blocks",
  options: { collapsible: true, collapsed: true },
} as const;

function createBlocksArchiveField(blockTypes: readonly PageBuilderBlockType[]) {
  return defineField({
    name: "blocksArchive",
    title: "Archived blocks",
    description:
      "Scaffolds and other blocks that were replaced. Nothing here appears on the Website.",
    type: "array",
    group: "content",
    fieldset: blocksArchiveFieldset.name,
    of: blockTypes.map((type) => ({ type })),
  });
}

export const blocksField = createBlocksField(generalPageBuilderBlockTypes);
export const blocksArchiveField = createBlocksArchiveField(
  generalPageBuilderBlockTypes,
);
export const contentBlocksField = createBlocksField(
  contentPageBuilderBlockTypes,
);
export const contentBlocksArchiveField = createBlocksArchiveField(
  contentPageBuilderBlockTypes,
);
export const homePageBlocksField = createBlocksField(
  homePagePageBuilderBlockTypes,
);
export const homePageBlocksArchiveField = createBlocksArchiveField(
  homePagePageBuilderBlockTypes,
);
