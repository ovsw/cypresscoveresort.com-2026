# Page Builder blocks

Read this guide before adding or changing a block in a page's `blocks` array.

## What the Starter ships

The Starter ships two blocks of its own, and a library of blocks converted
from Relume (see `docs/agents/relume-import.md`). Its own two are:

- **Rich Text** (`richTextBlock`): a finished long-form block. It is a valid
  final match for a Scaffold.
- **Scaffold** (`scaffold`): a placeholder with three fields, `name`,
  `richText`, and `proposedBlockShape`. The AI page-build workflow drafts a
  whole page as Scaffolds, then replaces each one with a block from the
  site's own library. The renderer shows the rich text under a visible
  internal marker with the name and proposed shape, and sets `data-scaffold`
  on the block. `frontend/scripts/verify-no-skeleton.mjs` fails when a
  published route contains one. A Scaffold has no theme, so it always joins
  its neighbours at an edge and never shares a band.

Every page document also has a `blocksArchive` array. It accepts the same
block types as `blocks` and sits in a collapsed **Archived blocks**
fieldset. Move a replaced Scaffold there instead of deleting it. The Website
never queries or renders `blocksArchive`, so nothing in it reaches a visitor.

A block a Website needs that neither list has belongs to that site's own
repository.

The [Schema UI starter guide](https://schemaui.com/docs/how-to-use) is useful for upstream examples. This repository and this guide are authoritative when they differ from the starter documentation.

## How a block reaches the page

A top-level block passes through this flow:

1. A Sanity schema defines its fields.
2. The Page schema allows editors to insert it.
3. A GROQ projection selects the data the frontend needs.
4. Sanity TypeGen turns the schema and query into TypeScript types.
5. The frontend block dispatcher selects its React renderer.

The block's Sanity `_type` is the shared identifier across every step. Use
camelCase for the type and kebab-case for filenames, as in `richTextBlock`
and `rich-text-block.ts`.

## A block never hides silently

A block, or an item inside one, never skips rendering because content is
missing while Studio lets the page publish. When a renderer needs a field to
draw something (a heading, an item's title, a button's text and destination),
make that field required in the schema. Studio then shows the error and
blocks publishing.

- When you write or change a renderer guard (`return null`, or a filter that
  drops items), validate the same condition the guard tests. A field the
  renderer always needs is required on its own. When the renderer draws with
  either of two fields (a heading or a body), validate them together, so one
  of them is enough. Give each rule a message that says what to add and that
  the block or item is not shown without it.
- Use `requiredText` from `studio/schemas/validation/required-text.ts` for
  every required string or text field. It rejects a value of only spaces,
  which the renderer trims away.
- Use `requiredRichText` from `studio/schemas/validation/required-rich-text.ts`
  for every required rich text field. It rejects empty paragraphs; an image,
  table or callout counts as content. Other required arrays need
  `.required().min(1)`.
- Add a case to `studio/schemas/validation/required-fields.test.mjs`. It runs
  Studio's own validation with the real schema.
- The only exception is data that the editor does not control, such as no
  posts yet or a reference to a hidden page.

Studio validation does not run on content written through the API. The launch
check covers that: `frontend/scripts/verify-no-skeleton.mjs` fails when a
published page holds a block that drew nothing or has no renderer. It finds
each block by the `data-block-key` attribute the Page Builder puts on the
block's wrapper.

## One block, one design

A block is one entry in the Page Builder catalogue: one `_type`, one
thumbnail, one design, one set of fields. A block never changes its design
through a field. A second design is a second block with its own `_type`,
fields, and preview image (`--preview` below). The shared `theme` field is
colour, not a design.
See `docs/adr/0001-one-block-one-design.md`.

The only setting that may change how a block looks is `theme`. Never add a
`layout`, `variant`, `style`, `design`, `look`, or `appearance` field to a
block, nor a switch for image position, alignment, column count, reversed
order, orientation or size, whatever its name. Never add a `hidden` rule keyed
on a design. An exception needs Ovi's express approval before the work starts.
`studio/schemas/blocks/one-block-one-design.test.mjs` fails when a block
has a field named like one of these; an approved exception goes in its
allow-list.

An optional field must not change the layout when it is left empty, such as
an optional image that turns a two-column block into a text-only one. Make
that field required, or build the text-only design as its own block.

Two reasons stand behind the rule. Content editors are not designers: they
choose content and the order of blocks, and the code owns the design. And
the catalogue thumbnail must show an editor what the block will look like
on the page; a thumbnail shows one layout, so it cannot stand for several.

## Keep the block library list current

`docs/content-model.md`, "Block library", is the text list of every block
an editor can insert: its `_type`, what it is for, and when to use it. Agents
that edit content for a client get this list and never read the code, so it
must match the code. Whenever you add, remove, rename, or change a block
(its fields, its purpose, or where it may be used), update its entry in the
same change. `studio/schemas/blocks/block-library.test.mjs` fails when the
list and the scope lists in `studio/schemas/blocks/page-builder.ts` name
different blocks. It cannot check that an entry's text is still true; that
is on you.

## One ask at a time

A page asks the visitor for one thing at a time. Never put two
call-to-action blocks in a row. A page ends with one closing call to
action, not a stack of them. Give a block that needs a secondary action a
second button in its own `buttons` array instead of a second call-to-action
block. If the block has no `buttons` array yet, adding one changes its
schema, projection and renderer: follow "Change an existing block" below.

## Add a top-level block

Generate the schema, query, renderer, and registrations together:

```bash
pnpm page-builder:new serviceHighlights --title "Service highlights" --dry-run
pnpm page-builder:new serviceHighlights --title "Service highlights"
```

Use `--scope content` (the default) for shared content blocks, `--scope
general` for regular pages only, or `--scope home` for the homepage only.
`--preview /path/to/image.jpg` adds a Studio grid preview. Without a preview,
Studio uses the schema's default representation. The generator refuses existing
files and serializes generator runs with `.page-builder-generator.lock`.
Remove that empty lock directory only after confirming its process has stopped.

Replace the generated fields with the real content model, then run TypeGen.
Add the block to the "Block library" list in `docs/content-model.md`; the
generator does not.
Keep the `page-builder-generator:*` markers at their registration points.

A generated block already follows the block theme and boundary contract
below: it has the shared `theme` field, projects `theme`, renders through
`blockSceneClassName`, targets its theme field from empty space, and exports
a content rule that the dispatcher uses to exclude it when empty. When you
change what the renderer needs before it shows content, update that exported
rule in the same edit.

For a manual addition, preserve the mirrored folder structure:

1. Define the Studio schema in `studio/schemas/blocks/`.
2. Register the schema and any supporting object schemas in `studio/schema-types.ts`.
3. Add the type to the correct scope in `studio/schemas/blocks/page-builder.ts`. The `blocks` and `blocksArchive` fields derive from those lists.
4. If a preview is available, add `studio/static/images/preview/<type>.jpg` and register its type in the preview set in that file.
5. Create its GROQ projection in `frontend/sanity/queries/`.
6. Register the projection in `frontend/sanity/queries/page-builder.ts`.
7. Create its React renderer in `frontend/components/blocks/` and register it in the `componentMap` in `frontend/components/blocks/index.tsx`.
8. Add its field-editing type and its empty-content rule to `isRenderableBlock` in the same file. Follow the block theme and boundary contract below.
9. Run TypeGen. Do not edit `studio/schema.json` or `frontend/sanity.types.ts` by hand.
10. Add the block to the "Block library" list in `docs/content-model.md`.

## Block themes and boundaries

Editors choose which content belongs together. Code owns the visual rules.

- **Theme.** Every finished block includes the shared field from
  `studio/schemas/blocks/shared/block-theme.ts` as its first field and
  projects `theme` in its GROQ query. The Website resolves a missing or
  unexpected value to Light with `resolveBlockTheme`. A block without a
  theme field, such as the Scaffold or a site's hero, joins every
  neighbour at an edge. Give a hero no theme field and keep its own treatment.
- **Spacing.** The renderer's outer element uses
  `blockSceneClassName(theme, top, bottom)` and accepts `BlockSceneProps`.
  Do not add unrelated outer vertical padding. Internal content spacing stays
  with the block's design. A block that fills the screen (a full-screen
  hero) never uses `h-screen` or `100vh`: its outer element takes
  `h-(--screen-block)` (the screen under the site header), or an element
  inside its padding takes `h-(--screen-block-content)`, so the block ends
  at the fold when it leads the page. Both subtract `--site-header-height`
  in `frontend/app/globals.css`, and the site header
  (`frontend/components/header/site-header.tsx`) takes its own height from
  that token (`h-(--site-header-height)`, its row centred). To make the
  header taller or shorter, change the token, never the header's padding;
  the heroes follow.
- **Seams and edges.** The Page Builder in `frontend/components/blocks/index.tsx`
  compares each pair of visible neighbors. Matching backgrounds form a seam and
  each side contributes half its block padding. Different backgrounds, and
  every join next to a themeless block, form an edge with full padding. The
  first and last visible blocks keep full outer spacing.
- **Bands.** `resolveBlockBands` in `block-boundaries.ts` groups
  seam-joined blocks into bands, and the Page Builder wraps each band in a
  div with `data-band="<theme>"` and `data-band-tuck` when its first block
  tucks. A Dark band carries one tonal sweep and one grain overlay that span
  the whole run, so the texture does not restart at a seam. The band paints
  no background; blocks keep their own colour. The glow, shade, and grain
  tokens live in `frontend/app/globals.css` next to the tuck depth token.
- **Visible adjacency.** Only blocks that render content take part. Each
  block's empty-content rule lives in `isRenderableBlock`, next to the
  `page-builder-generator:visible-blocks` marker, and must match the renderer's
  own empty result. Unsupported blocks are skipped the same way.
- **Empty-space editing.** The outer element carries
  `data-sanity={dataAttribute?.("theme")}` so a click on empty space in Studio
  Presentation focuses the theme field. Content elements keep their own field
  targets.
- **Theme tokens.** `.block-scene-light` and `.block-scene-dark` in
  `frontend/app/globals.css` re-point the job tokens (see [Colour](#colour)),
  so text, links, buttons, cards, icons, and focus states adapt without
  variant changes.

## Colour

Colour has two layers in `frontend/app/globals.css`:

1. **Brand colours** (`--brand-*` in `:root`): the Website's palette. They
   sit outside `@theme`, so Tailwind makes no utility classes for them. A new
   Website replaces their values; the Starter ships a neutral palette.
2. **Job tokens** (`--color-*` in `@theme`): each names what a colour does
   and points at a brand colour. There is the shadcn set (`background`,
   `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`,
   `accent`, `destructive`, `border`, `input`, `ring`, each with its
   `-foreground` pair where shadcn has one) and these named jobs:
   `soft-foreground`, `link`, `link-hover`, `link-foreground`, `prose-link`,
   `prose-link-hover`, `emphasis`, `primary-hover`, `mark`, and `scrim`. The
   comment beside each token in `globals.css` says what it is for.

The colour rule:

- Component code uses only job tokens: `text-foreground`,
  `text-muted-foreground`, `text-link`, `bg-primary`, `border-border`,
  `bg-scrim/80`, and so on. A job token with an alpha
  (`border-foreground/20`) is fine.
- Never write a brand colour, a hex, `rgb()` or `oklch()` value, or a
  Tailwind palette class (`bg-white`, `text-zinc-600`) in a block or a
  component. A brand colour name in component code compiles to no class and
  is a bug.
- A block theme re-points job tokens to brand colours. It never defines a
  brand colour, and a block never branches on its theme to pick a colour.
  When a new theme or a new job needs a colour, add the brand colour to the
  palette and point a job token at it in every block theme.
- Pick the token by job, not by value: a link is `text-link` even where it
  has the same value as `text-foreground`, so a palette change reaches it.
- Text over a photo sits on a scrim (`bg-scrim/60` or darker over the
  photo, so the text passes 4.5:1 even over a white photo), in a layer with
  `block-scene-dark text-foreground`, so it uses the Dark scene's job
  tokens whatever the block's theme. Never `text-white`.
- Shadows, glows, and overlays in `globals.css` mix brand colours with
  `color-mix()` instead of literal values.
- Sharing cards (`frontend/public/brand/brand.json`) take their colour from
  their own file, because the image renderer cannot read CSS variables.
- Check text contrast on every block theme. The smoke test's axe scan
  runs on one route per template and fails on reported violations: normal
  text below 4.5:1, large text below 3:1. It skips what axe cannot decide
  (text over images or gradients), so a passing scan does not replace
  checking each theme by eye.

### Irregular edges and tucks

Code supplies an irregular top edge; there is no editor shape selector.

1. Register the block type in `blockEdgeTreatments` in
   `frontend/components/blocks/index.tsx`, for example `callToAction: "wave"`.
2. Have the renderer accept `topTreatment` and pass it as the fourth argument
   of `blockSceneClassName`.
3. Give the treatment a class in `frontend/app/globals.css` that paints the
   shape with `background: inherit` and pulls the block up by the tuck depth
   with a negative top margin. Follow `.block-scene-wave-top`. The block
   above pads its bottom by the tuck depth and the crest height (the
   `[data-band]:has(+ [data-band-tuck])` rule), so content on both sides sits
   the same distance from the shape.

The resolver enables a treatment only at a different-background join. At a
seam it suppresses the treatment so no gap or third color appears. A later
block paints above the earlier one, so when both neighbors have treatments,
the lower one wins. A wave after a hero tucks the hero underneath. The Starter
ships one shallow wave shape and registers no block for it; add more shapes
only when a site needs them. Footer tucks are not shipped, but a site may add
one.

## Add a nested object

A nested object is used only inside another block, such as a card inside a grid. It still needs a Studio schema registration, a parent GROQ projection, and a React renderer or parent rendering logic. It does not belong in the Page schema's `blocks.of`, Page insert-menu groups, or the top-level `componentMap` unless editors can insert it directly on a page.

## Change an existing block

Trace the whole vertical slice before editing:

- Studio fields: `studio/schemas/blocks/`
- GROQ data shape: `frontend/sanity/queries/`
- Generated types: `frontend/sanity.types.ts`
- React rendering: `frontend/components/blocks/`

When a field is added, renamed, or removed, update the block's entry in the "Block library" list in `docs/content-model.md` if it no longer describes the block. Update the schema and projection together, regenerate types, and consider whether existing Sanity documents need compatibility handling or a migration.

For visual changes, treat the existing design system as the default:

- Reuse tokens from `frontend/app/globals.css`. Colour follows the rule in
  [Colour](#colour): job tokens only, never a brand colour.
- Reuse shared buttons and nearby block patterns before adding a new primitive.
- Give a block with buttons one `buttons` array with a `max` count. Editors never pick a button style: the renderer sets it by position (first is primary, second is secondary, and so on).
- Check the full page and mobile layout, not only the block in isolation.
- Never add a layout, variant, or style field to change how a block looks. A new design is a new block (see "One block, one design" above).

## Definition of done

- The same `_type` is present at every required top-level registration point.
- The GROQ projection returns every field the renderer uses, including `theme` for themed blocks.
- The renderer uses `blockSceneClassName`, targets its theme field, and has a matching empty-content rule in the dispatcher.
- Studio validates the same condition the renderer tests before it draws (see [A block never hides silently](#a-block-never-hides-silently)).
- The block uses only job tokens for colour (see [Colour](#colour)).
- The block has its own preview image in the Studio catalogue.
- The "Block library" list in `docs/content-model.md` has a current entry for the block.
- The Studio preview and frontend renderer work with realistic content.
- Generated files are current and are not manually edited.
- Browser-free repository verification passes:

  ```bash
  pnpm verify
  ```
