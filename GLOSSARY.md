# Domain context

This file defines the shared language for the Starter.

## Product terms

**Starter**

This reusable repository before a site creator creates a site from it.

**Site**

An independently owned repository created from the Starter. It owns its code, configuration, content, credentials, and deployments. "Project copy" is the retired word for a site. Avoid: project copy.

**Site creator**

The person who configures a site for a specific Website. "Project creator" is the retired word for a site creator.

**Website**

The public Next.js application in `frontend/`.

**Studio**

The separately deployed Sanity editing application in `studio/`.

**Sanity project**

A hosted Sanity resource owned by the site creator. The Starter never creates or supplies one.

**Dataset**

The named content store inside the site creator's Sanity project.

**Site settings**

Global editable Website identity and content, including the site name, navigation, footer, and contact details.

**Page Builder**

The ordered block editor used to compose a page.

**Block**

In full, **Page Builder block**. One entry in the Page Builder catalogue: one `_type`, one thumbnail, one design, one set of fields, with a Sanity schema, a GROQ projection, and a React renderer. A page holds its blocks in its `blocks` array. A block never changes its design through a field; a second design is a second block (see `docs/adr/0001-one-block-one-design.md`). The shared block theme is colour, not a design. Say plain "block" day to day. Use the full form only where rich text is also in play: inside rich text, Sanity's `block` type is a paragraph of Portable Text, a different thing. "Section" is the old word for a block. The Starter ships two blocks of its own, Rich Text and Scaffold, and a shelf of blocks converted from Relume. A site keeps only the Relume blocks it adds, and builds its own. Avoid: section, page block, layout, variant, look.

**Relume component**

An item in Relume's library, before conversion. Always say "Relume component", never bare "component". Converting one gives one block.

**UI component**

A button, image or card: the parts a block is built from.

**Convert**

Turn one Relume component into one block with `pnpm relume:convert`, which writes the block's files and registers it.

**Catalogue**

`relume/catalogue.json`: every Relume component, with its category, tags and preview image. The Page Builder catalogue is a different list: the blocks an editor can insert.

**Inventory**

The status of every catalogue entry (not pulled, convertible, needs judgment, converted), written by `pnpm relume:inventory` to `relume/inventory.json` and shown at `/dev/relume`.

**Shelf**

Every block the Starter has converted from Relume, kept registered in the Starter and listed in `relume/shelf.json`. A site adds blocks from it with `pnpm relume:add`.

**Block library**

The pages that show every block converted from Relume: an index at `/block-library` with a Category filter (`/block-library?category=heroes`), and a seeded page per block that shows only that block, on Light (`/block-library/heroes/header-1`) and on Dark (`.../header-1/dark`). Also the list of every block in `docs/content-model.md`.

**Brand colour**

One colour of the Website's palette, a `--brand-*` variable in `frontend/app/globals.css`. It sits outside the Tailwind theme, so no utility class exists for it. Only job tokens and block themes point at brand colours. Avoid: palette class, raw colour.

**Job token**

A colour named for what it does, such as `foreground`, `link`, or `primary`: a `--color-*` variable in the Tailwind theme that points at a brand colour. Component code uses only job tokens. A block theme re-points job tokens, so one piece of markup is right on every theme.

**Scaffold**

A placeholder block that holds a page's intended content before a real block exists for it. It has a name, rich text, and a proposed block shape. The Website renders it with a visible internal marker during Building, and the launch check fails while one is published.

**Blocks Archive**

The `blocksArchive` array on a page document. A replaced Scaffold moves here instead of being deleted. The Website never queries or renders it.

**Draft**

Content visible to an authorized editor through preview before publication.

**Published content**

Content available to public Website visitors.

**Redirect**

A permanent route from an old public URL to its current destination.

## Ownership rules

- Code owns layout, rendering rules, validation, and safe fallbacks.
- Sanity owns editor-managed content and site settings.
- Each site owns its Sanity project, dataset, credentials, and hosting.
- The Starter contains no shared credentials or hosted-resource fallback identifiers.
