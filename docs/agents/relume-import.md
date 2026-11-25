# Importing Relume components

The Starter carries a library of Page Builder blocks converted from the
Relume React component library. Read this guide before you pull, convert, or
change one. `docs/agents/page-builder.md` still applies to every block.

This repository is private because of this library. Relume's licence allows
the components in client Websites and forbids passing the library on. Never
publish the repository, and never copy `relume/` or the imported blocks
anywhere but a Website built from this Starter.

## The parts

| Path | What it holds |
| --- | --- |
| `relume/catalogue.json` | Every Relume component: `slug`, `name`, `category`, `tags`, `preview` image URL, `uncommon`, `layoutStyle`. See "Catalogue fields". |
| `relume/source/<slug>.tsx` | The untouched Relume original. Never edit it. |
| `relume/source/primitives/` | The Relume primitives the originals import, for reference only. |
| `scripts/relume/` | The importer: `split-pull.mjs`, `convert.mjs`, `inventory.mjs`, and `lib/`. |
| `studio/schemas/blocks/relume/<slug>.ts` | The block's Studio schema. Generated. |
| `frontend/sanity/queries/relume/<slug>.ts` | Its GROQ projection. Generated. |
| `frontend/components/blocks/relume/<slug>.tsx` | Its renderer. Generated. |
| `frontend/components/blocks/relume/<slug>.client.tsx` | The browser half of an animated block's renderer. Generated. See "Animated blocks". |
| `frontend/components/blocks/relume/block-*` | Helpers every imported block shares: images, buttons, video pop-ups, tabs, click-to-edit targets. Written by hand. |
| `studio/scripts/seed-relume-blocks.mjs` | One sample block per imported block, for the Block library's seeded block pages: a page of its own for every block, on Light and on Dark (`/block-library/heroes/header-1` and `/block-library/heroes/header-1/dark`). `studio/scripts/block-library.mjs` builds them from each block's category and name in `relume/shelf.json`. The index that lists them, `/block-library` with a Category filter (`/block-library?category=heroes`), is a Website route. |
| `relume/shelf.json` | The shelf manifest: every registered block with its files, shared files, packages, Block library entry and seed block. Generated; see "Shelf". |

A block's `_type` is `relume` plus the Relume name: Layout 16 is
`relumeLayout16`, in files named `layout16`.

## 1. Pull the Relume original

The Relume library MCP (`relume-library`) needs a sign-in, so a script cannot
call it. An agent does:

1. Call `get_components` with up to 20 slugs and `primitives: "names-only"`.
   A result that large is saved to a text file; the tool reply names it.
2. File the result:

   ```bash
   pnpm relume:split-pull /path/to/the-saved-result.txt
   ```

Fewer than about six Relume components may come back inline instead of as a file.
Ask for more slugs in one call so the result is saved.

## 2. Convert

```bash
pnpm relume:convert layout16 --dry-run   # report only
pnpm relume:convert layout16             # write and register
pnpm typegen
```

The command writes the three files (four for an animated block), registers
the block at the
`page-builder-generator:*` markers, adds its entry to "Block library" in
`docs/content-model.md`, and adds its sample block to the seed.

What the converter does to a Relume original:

- **Fields.** It reads the component's `Props` type and `Defaults` object.
  A string becomes a string field (a text field when the sample is long), an
  `ImageProps` an image with alt text, a `ButtonProps[]` the shared `buttons`
  array with the original's button count as its maximum, and a list of
  objects an array of inline objects. Studio shows the fields in the order
  the component draws them.
- **Required fields.** The heading (or the first text field) is required, in
  the block and in each list item. Every image is required and every list
  needs one item. Any other text field is optional and is drawn only when
  filled. This follows "A block never hides silently".
- **Block scene.** The Relume component's own padding goes; the block uses
  `blockSceneClassName` and gets the shared `theme` field. When Relume pads
  an element inside the `<section>` instead (Header 145's first `<div>`,
  Header 153's text column after its images), and the `<section>` has no
  padding of its own, the first element that carries a section's padding
  (`px-[5%]` with a vertical padding such as `py-16`) drops it, so it does
  not stack on the block padding. When content follows it in the block
  (Header 145's image under its text), it keeps its bottom padding
  (`py-16` becomes `pb-16`) as the space before that content; plain text
  counts as content, indentation does not. A list's items are not searched.
- **Class map.** `scripts/relume/lib/classes.mjs` maps Relume's type scale,
  colour schemes, radii, and its Tailwind 3 preset values to the Starter's
  tokens and Tailwind 4. Relume has six heading steps and the Starter four,
  so neighbouring steps share one.
- **Images and buttons.** `<img>` becomes `BlockImage`; a button list
  becomes `BlockButtons`, which takes each button's style from its
  position, as the Relume original set it. Relume's buttons for a dark
  ground (`alternate`, `secondary-alt`, `link-alt`) take the plain roles,
  since the scene sets the ground. A `flex` row of buttons wraps on a
  narrow screen instead of overflowing it (`BlockButtons` adds `flex-wrap`
  and a 1rem row gap that a gap the block sets overrides), since a button
  keeps its label on one line.
- **Image sizes.** `BlockImage` tells the browser an image takes half the
  page on a desktop. An image that fills the content width at every screen
  width (`w-full` or `size-full`, with no column layout, flex row, fixed
  width or maximum width around it, outside a list and a helper component:
  Header 145's photo under its text) gets `sizes="100vw"` instead, so the
  browser loads a sharp source for it (`spansContentWidth` in
  `scripts/relume/lib/render.mjs`).
- **Description.** A block's description is its Relume category and
  catalogue tags, less any tag that names something the block does not
  have: "lightbox", and "multiple images" when its fields hold one image.
- **Tabs.** Relume's `Tabs`, `TabsList`, `TabsTrigger` and `TabsContent`
  (`@/components/ui/tabs`) become the Starter's `BlockTabs…` parts
  (`block-tabs.tsx`, Radix Tabs with a focus ring). Each part gets its full
  class list: Relume's defaults in job tokens, less the classes the
  component's own list replaces (the same property and variants, or `p-…`
  for `px-…` and `py-…`), as for a card. A tab's `value` and the block's
  `defaultTabValue` are not fields: a tab's id is its item's `_key`, and the
  first tab opens first. A tab's `trigger` text is its `label`, and it may
  wrap: Relume's `whitespace-nowrap` is left out, since an editor's label
  can be longer than a narrow screen. An image or
  object marked optional in an item (`image?:` beside `video?:` in Layout
  499's tabs, where a tab shows one or the other) stops: decide by hand
  what a tab may hold.
- **Objects.** An object that holds a required member (its lead text, an
  image, a video) is required itself: Studio checks an object's members
  only when the object is set.
- **Field names.** Two fields that would take the same name after a rename
  (`data` beside `features`) stop.
- **Single buttons.** A lone button (`button: ButtonProps`, drawn as
  `<Button {...button}>{button.title}</Button>`) is a `buttons` array of at
  most one, as the hand-finished `faq3` has it: `button` becomes `buttons`,
  `articleButton` `articleButtons`. It is drawn by `BlockButtons`, in place
  of its wrapper when it is the wrapper's only content and the wrapper
  carries nothing but classes (a wrapper with an `id` stays). A class on the
  button itself (`w-full`) goes to its role. A button that submits a form
  stops, and so does one drawn any other way or named like a field the
  component already has.
- **Helper components.** A component in the same file that the block hands
  content to (a list item or an object: `<FeatureSection {...featureSection}
  index={index} />`, `<FeatureCard tab={tab} />`), or that draws a heading,
  is drawn in place of its call (Layout 410). Its texts then get their
  optional-text test and click-to-edit target, its buttons their roles, and
  its headings a level among the block's own. The values it declares before
  its return (`const isEven = index % 2 === 0`) are written where they are
  read. A helper that takes only images stays a component. A helper is not
  drawn in place, and stops, when it keeps state or calls a hook, takes
  children, or does more than declare values before its return.
- **Cards.** Relume's `<Card>` and `<BackgroundCard>`
  (`@/components/ui/card`) are a `<div>` with a class list. They are drawn
  as one: `<Card>` gets `overflow-hidden rounded-card border border-border
  bg-card text-card-foreground`, as the hand-finished `pricing18` draws its
  cards, and `<BackgroundCard>` gets `overflow-hidden rounded-card`. A class
  the component sets itself replaces the card's (its own `bg-…`,
  `overflow-…`, `rounded-…`, text or border colour). A card that takes
  `variant` or spread props stops, a `bg-white` on a `<Card>` goes (the card's
  ground is `bg-card`), and so does a card wrapped in Motion
  outside the component (`const MotionCard = motion.create(Card)`).
- **Video pop-ups.** Relume plays a video in a pop-up: a `<Dialog>` whose
  trigger is a play button (a poster image, a dark layer, a play icon) and
  whose content is one `<iframe>` of a `video` prop (Header 154, Layout 26).
  It becomes `BlockVideoDialog` (`block-video-dialog.tsx`) around the play
  button; the dialog's content, its spinner and the state that tracked it
  go, since the helper owns them. The `video` field is a required link an
  editor pastes from YouTube or Vimeo (`videoLink` in
  `studio/schemas/validation/video-link.ts`; `shared/video-link.ts` reads
  the link for Studio and the Website alike), and the player loads only when
  a visitor opens the pop-up. The play button takes the Dark scene on any
  theme: its dark layer becomes `bg-scrim/60` and its white icon
  `text-foreground`. In Presentation a click on the icon edits the video, a
  click on the poster its image. The field is told apart by its sample (the
  address of a YouTube or Vimeo player), so a video file (Layout 355's
  background video) still stops, and so does a `<Dialog>` that holds
  anything else, in its trigger or beside the `<iframe>` and its spinner.
- **Photo backdrops.** A block drawn over a photo (a covering
  `absolute inset-0` layer with the `<img>` and a `bg-neutral-darkest/50`
  layer) keeps its text readable on either theme: the dark layer becomes
  `bg-scrim/60` (Relume's opacity when it is higher; 60% keeps the Dark
  scene's text above 4.5:1 even over a pure white photo, where Relume's 50%
  gives 3.8:1), and each content layer over it gets
  `block-scene-dark text-foreground` (a layer that holds only buttons
  too), so its white text becomes `text-foreground` and its buttons take
  the Dark scene's colours. Text over the photo stays opaque:
  `text-white/50` becomes plain `text-foreground`, since the scrim's
  opacity is worked out for the full colour. The
  photo is loaded at full page width, and the scrim lets a click through to
  it for click-to-edit.
  The same holds for a panel drawn over its own photo inside the block
  (each of Layout 420's pinned panels, Header 83's pinned screen): any
  element with such a covering layer among its children is treated this
  way. A white rule over the photo (`border-white`) becomes
  `border-foreground`. A white icon in a button (`text-white` on Layout
  326's chevron) loses its colour and takes the button's. A foreground
  layer that Motion animates is raised above the photo layer
  (`relative z-10`): Motion gives it a stacking context of its own, which
  would otherwise trap its text under the photo.
- **Logos.** Every image in a logo section (category `logo-sections`,
  `logoCategories` in `scripts/relume/convert.mjs`) is a logo, and so is an
  image anywhere else whose field name or Relume sample file name holds
  "logo" (`isLogoImage` in `scripts/relume/lib/model.mjs`): Testimonial 1's
  `logo`, Testimonial 2's `image` with the sample `webflow-logo.svg`. Logo artwork
  is usually dark on a transparent ground, so on a Dark theme it is drawn in
  white with `blockLogoClassName` from `block-image.tsx`, the class list the
  hand-finished `logo3` uses too, and its field help asks for logos with a
  transparent background. A logo passed to a helper component stops the
  conversion, since the helper draws every image it is given alike.
- **Full-screen heights.** A full-viewport height (`h-screen`, `h-svh`,
  `min-h-svh`, and so on) fills one screen under the site header, not more:
  on the block's own element it becomes `h-(--screen-block)`, the screen
  less the header; inside the block padding it becomes
  `h-(--screen-block-content)`, which also takes off that block's own
  padding. Both tokens are in `frontend/app/globals.css` and subtract
  `--site-header-height`, the token the site header takes its height from.
  An element that
  fills the screen (a full-screen height or minimum height; a maximum
  height only caps it), unpinned, at every width drops its own vertical
  padding (`py-*`), which Relume puts there in place of the section's. A
  pinned (`sticky`) panel keeps `h-screen` at the breakpoints where it is
  sticky: the header has scrolled away when it pins. `h-svh lg:sticky`
  becomes `h-(--screen-block-content) lg:h-svh`.
- **Columns that push their parts apart.** A `flex-col justify-between`
  column with no gap and no margin between its parts gets `gap-8`, so they
  never touch when the column has no spare height (equal-height cards).
- **Icons.** `relume-icons` become `lucide-react` icons.
- **Headings.** Relume picks a heading tag for its size, so the levels a
  component uses become consecutive ones in the same order (`h2` then `h6`
  becomes `h2` then `h3`), with the block's own heading (its required
  `heading` field) first: a heading tag that ranks above it in Relume
  ranks below it here, and another heading with the same tag as the
  block's heading ranks one level below it (Stats 8 draws its heading and
  each statistic's label as an `<h3>`; here they are `h2` and `h3`). A
  heading tag that holds nothing but a figure (a
  statistic's "30%", its sample a number) is text, drawn as a `<p>` with
  the same classes. Only a hero (a block of a category in
  `heroCategories`) may start at `<h1>`, and only when it is the first
  block on the page: its heading tags follow a `leadsPage` prop the Page
  Builder sets, and the page then leaves out its own title heading. Anywhere
  else a hero starts at `<h2>`, so a page always has one `<h1>`.
- **Separators.** Punctuation between two optional texts (a comma between a
  job title and a company) is drawn only when both are filled.
- **Field names.** A name that reads as a design switch is renamed
  (`position`, a job title, becomes `jobTitle`). So is `data`, Relume's name
  for the list of features in some feature sections, which becomes
  `features`.

### Animated blocks

A Relume component that uses hooks, Motion (`motion/react`), or `"use client"`
runs in the browser. Relume leaves `"use client"` off some of them, so the
converter decides by the hooks and imports. For such a component it:

- **Writes two renderer files.** `<slug>.tsx` stays on the server: the Page
  Builder calls its content rule, and a Client Component cannot export one.
  `<slug>.client.tsx` starts with `"use client"` and draws the block.
- **Keeps the code.** The values declared before the `return` (hooks, refs,
  config arrays), helper components in the same file, and the type aliases
  they name are carried over. Class lists inside them (template literals,
  `positionClasses: "..."`) go through the class map.
- **Passes click-to-edit targets as data.** A function cannot be passed to a
  Client Component, so the block gets `editing` and builds `dataAttribute`
  with `blockDataAttribute` from `block-editing.ts`.
- **Respects reduced motion.** The block is wrapped in
  `<MotionConfig reducedMotion="user">`, and every `motion.*` element gets a
  class that holds it at rest (`motion-reduce:transform-none!`,
  `motion-reduce:opacity-100!`). Motion writes inline styles, which only an
  important class overrides. The converter reads what each element animates;
  it handles movement and opacity, and a `width` or `height` the scroll
  grows through `useTransform` (Header 82's video, from `90%` to `100%`),
  which rests at the size it ends at (`motion-reduce:w-[100%]!`). It stops
  on anything else, and on an image Motion animates itself (`<motion.img>`).
- **Attaches a scroll ref Relume left loose.** Header 143 gives `useScroll`
  a `sectionRef` that it never puts on an element, so Relume's own
  animation does not run. A ref named for the section that `useScroll`
  follows goes on the block's element.
- **Stops on a scroll position read from the top of the page.** `scrollY`
  or `scrollX` taken from `useScroll({ target })` is the page's position,
  not the block's, so an animation tied to it is wrong as soon as the block
  is not first on the page (Header 75, finished by hand).
- **Shows a video under its text.** A covering layer that holds a video
  pop-up in a pinned block (Header 154's poster under the text panel that
  slides away) takes its own place under the text for reduced motion.
- **Reads the screen width with the Starter's hook.** Relume's
  `useMediaQuery` (`@/hooks/use-media-query`) is the Starter's hook of the
  same name (`frontend/hooks/use-media-query.ts`), false on the server and
  until the page has hydrated.
- **Unpins a pinned scroll block.** A block that pins a panel (`sticky`)
  while the scroll moves its content would hide content from a visitor with
  reduced motion. For them the panel is unpinned, the tall scroll track
  (`h-[400vh]`) shrinks to its content, and a row that slides sideways is
  stacked. The converter stops when it cannot read the pinned element's
  classes or the sliding element is not a flex row.
- **Shows a looping column in full.** A column that loops upwards inside a
  clipped window (`animate-loop-vertically`) would hide its lower images with
  reduced motion, so the window then grows to its content.
- **Keeps buttons clickable.** A layer laid over the whole block
  (`absolute inset-0 z-*`) with nothing to click inside gets
  `pointer-events-none`; what it draws stays clickable for click-to-edit.
- **Fixes the size of a list read by position.** A design that places
  `images[0]` to `images[3]` gets a list of exactly four in Studio. So
  does one that styles images by position: Header 83 hides images
  `[0, 2, 3, 5, 6, 8]` of its grid on a phone, and gets a list of exactly
  nine.

The `animate-*` classes of Relume's Tailwind preset (`loop-*`, `marquee-*`,
`tabs`) are defined in `frontend/app/globals.css`, with Relume's timings. A
block that uses only those stays a plain server file. The reduced-motion
rule at the end of `globals.css` stops them.

## 3. When the converter stops

The converter never guesses. When a Relume component needs a decision, it writes
nothing, prints "Needs judgment" with each reason, and exits with status 2.
Common reasons: an import the Starter does not have (sliders, tabs, dialogs,
`use-media-query`), an animation the converter cannot hold still for reduced
motion (an animated width or colour), a hook
called in a loop, a renamed import or a value declared outside the
component, text used as data (`heading.split(" ")`), more heading levels than `<h6>` allows, a helper component that
keeps state or calls a hook (see "Helper components"), a palette colour with no job
token, a button that submits a form,
a string that holds a link, a video file or a photo's address (by its name,
or by a sample that starts with `http`; a video played in a pop-up
converts, see "Video pop-ups"), more than four images numbered one by one
(`image1` to `image12`: a strip that is one list to an editor), an icon with
no match yet.

Then choose one:

- **Teach the converter**, when the same reason will come up again: add the
  mapping (an icon, a class, a variant, a field name) to `scripts/relume/lib/`
  with a test in `scripts/relume-import.test.mjs`, and convert again.
- **Finish by hand**, when the Relume component is one of a kind: build the
  block with `pnpm page-builder:new`, in the same `relume/` folders and with
  the same `_type` naming, following `docs/agents/page-builder.md`. List it
  under "Hand-finished blocks" below, so nobody regenerates over it.

Not imported for now: navbars and footers (the Starter builds the header and
footer from their own documents), and every form (contact, multi-step,
banner sign-up), which needs a submission backend first. The converter
refuses the whole contact category; a contact section without a form is
finished by hand (see `contact18` and `contact13` below).

## 4. Check

`scripts/relume-import.test.mjs` fails when a generated file differs from
what the converter writes today, so a change to the converter means
converting the affected blocks again (delete their three files, the
`.client.tsx` file if there is one, and their registration lines, then run
`pnpm relume:convert`).

Before a pull request:

```bash
pnpm typegen
pnpm typecheck
pnpm lint
pnpm test
```

Then look at the block on its own Block library page, next to its Relume
preview (`preview` in `relume/catalogue.json`), on Light and on Dark. The
page is `/block-library/<category>/<block>`, such as
`/block-library/heroes/header-1`; the Dark page adds `/dark`, and the switch
at the top of the page goes between them. The index filtered to its category
(`/block-library?category=heroes`) shows the block's card. Write the new block's
drafts first with `pnpm page:seed studio/scripts/block-library-page.seed.mjs --apply`.
For an animated block the preview is a GIF: compare the movement, then
turn on reduced motion and check that nothing moves and no content is lost.

When you ask someone to review the block, give the block's own page as the
link, on the running local dev server, never the index with directions to
find it. The seed writes drafts, and the Website shows a draft
only in draft mode, so a plain link such as
`http://localhost:3000/block-library/heroes/header-1` is a 404 until the
pages are published. Give the link through the local Studio's Presentation
tool, which turns draft mode on: for example
`http://localhost:3333/presentation?preview=/block-library/heroes/header-1`
(the ports are in `.worktree-ports.json` when the worktree has one). Once the
block pages are published, the plain link works. For screenshots, run `pnpm page:shots
block-library/heroes/header-1` (and `.../header-1/dark`): the page holds only
that block.

## Inventory

```bash
pnpm relume:inventory
```

It prints, per category, how many Relume components are not pulled, convertible
(the dry run of `pnpm relume:convert` finds no stop), stopped by the
converter (needs judgment), or converted, with a totals row.
`pnpm relume:convert` and `pnpm relume:split-pull` refresh the file below
when they finish.

| File | What it holds |
| --- | --- |
| `relume/inventory.json` | Every catalogue entry with its catalogue fields, its status, the converter's reasons when it stops, and its decision. Generated and gitignored; run the command again to rebuild it. |
| `relume/decisions.json` | Which components we want or skip: `{ "<slug>": "want" \| "skip" }`, keys sorted. No entry means undecided. Committed. |

To browse it, open `/dev/relume` (every category with its counts) or
`/dev/relume/<category>` (that category's components, with Want and Skip
buttons that write `relume/decisions.json`) on the local dev server. Both
pages exist in development only.

## Shelf

A Website's editors see only the blocks chosen for that site, not every
block the Starter has converted.

- **The Starter is the shelf.** It keeps every converted block registered,
  so each one is type-checked, tested and on the Block library.
- **A Website holds only what was picked.** A new site starts with no Relume
  blocks: `pnpm run setup` removes them all from a site fresh from the
  template, never in the Starter. The new site's `relume/shelf.json` marks it
  as fresh; setup's first run deletes that file whatever it finds, so it
  empties a site at most once, and a later run keeps every block.
  Blocks are added one at a time from the shelf, and can be removed.
- **Editors see only what is registered.** The Studio insert menu and the
  Block library list follow the registrations; nothing is hidden in Sanity.

`relume/shelf.json` lists the shelf: per block its slug, `_type`, name,
category, tags, preview, own files (schema, query, renderer, the
`.client.tsx` file and the Studio thumbnail when it has them), the shared
files and npm packages only Relume blocks use, its Block library line and
its seed block. `pnpm relume:convert` rewrites it after registering a
block; `pnpm relume:shelf` rewrites it by hand. A test fails when it and
the registered blocks differ.

Run these in the Website:

```bash
pnpm relume:add layout16 header141     # add from the Starter on GitHub
pnpm relume:add layout16 --force       # replace layout16's files with the shelf's
pnpm relume:add layout16 --from ../next-sanity-starter   # read a local Starter checkout
pnpm relume:remove layout16
pnpm relume:remove --all
```

- `pnpm relume:add` gets the shelf by a shallow clone of the Starter's
  default branch into `~/.cache/relume-shelf`, with your own git access. It
  copies the block's files, registers it everywhere `pnpm relume:convert`
  does (with the same code), adds its seed block, regenerates the Sanity
  types, then runs the type check and the block tests. Any failure puts
  every file back. The cache is locked while it is fetched and read, so an
  add or shelf page in another site at the same time refuses and asks you
  to retry.
- A shared file the site lacks is copied. One the site has that differs from
  the Starter's is left alone, and the command says so.
- A package the site lacks is added to `frontend/package.json` at the
  Starter's version; run `pnpm install`, then the checks.
- A block already in the site is refused; `--force` replaces its own files
  with the shelf's and keeps its registrations. That is how a later Starter
  fix reaches a site. Nothing updates a site by itself.
- `pnpm relume:remove` first asks the site's dataset (from
  `studio/.env.local`) for documents, drafts included, that use the block.
  If any do, it stops and lists them. Otherwise it removes the files, every
  registration, the Block library line and the seed block. Shared files and
  packages stay.

To browse the shelf, open `/block-library` on the local dev server. It
lists the blocks by category with the inventory's filters and a Category
filter (`/block-library?category=heroes`); each card links to the block's
own page when that page exists. Under `next dev` the page lists the whole
shelf and each card shows "In this site" with Remove, or Add; the buttons
run the commands and show what they printed. In the Starter every block is
in the site. In production the same page lists only the site's own blocks,
read from `relume/catalogue.json` at build time, with no Add, Remove or link
to `/dev/relume`.

## Catalogue fields

`uncommon` (true or false) and `layoutStyle` (a list such as
`["off_grid", "background"]`, empty when Relume gives none) come from the
Relume library MCP's `list_components`. The category page's "Uncommon" and
"Off-grid" toggles read them. The MCP says nothing about which components
have interactions, so the "Interactions" toggle reads the preview instead:
Relume previews those components (animations, scroll effects) with an
animated GIF, so a `.gif` preview counts as having interactions.

To refresh them, an agent:

1. Calls `list_components` with no `category`, `limit: 100` and `offset` 0,
   100, 200 and so on until a page is short, and saves each page's full text
   to a file. Check each page lists as many components as its "Showing N"
   line says.
2. Does the same with `uncommon: true`.
3. Runs:

   ```bash
   pnpm relume:catalogue-fields --all <full-pass files...> --uncommon <uncommon-pass files...>
   ```

The command matches entries by display name (the MCP's own slugs differ:
`section_cta37`, `banner1_component`), refuses unless the full pass names
every catalogue entry and nothing else, refreshes `tags` and `preview`, lists
every entry that changed, and refreshes `relume/inventory.json`.

## Hand-finished blocks

List each one on its own line, as a list item that starts with its file name
in backticks. The in-step test skips the names listed here.

- `team1`: each team member (image, name, job title, description, social links) is drawn by a helper component the converter cannot pass a whole member to; social links reuse the Starter's `socialLink` object (label and URL) and draw an icon from the link's hostname, as the Website footer does (`block-social-links.tsx`); the single footer button is a `buttons` array of at most one, inside a `footer` object.
- `team7`: hand-finished as `team1`, in three left-aligned columns.
- `header75`: converted, then its text fade changed by hand in `header75.client.tsx`. Relume fades the text by the page's own scroll position (`scrollY` from `useScroll` with a `target`, which is still measured from the top of the page), so the heading was invisible when the block was not first on the page. The fade follows the block's own `scrollYProgress` instead. The converter stops on that pattern.
- `gallery24`: converted, then its slide changed by hand in `gallery24.client.tsx`. Relume slides the row by its own fixed width (`-100%` of a `w-[400vh]` track) over the whole section's scroll, so the row kept moving after the last image had left and the pin ended on an empty screen. The row now slides only while it is pinned (`offset: ["start start", "end end"]` on the tall wrapper), by a distance measured in pixels: from the first image at the left edge to the last image's centre on the centre of the screen.
- `pricing18`: each plan has a list of feature lines and one button in its own `buttons` array, which the converter cannot model; the Relume `Card` is drawn with the class map's card classes.
- `testimonial17`: the star rating is a required whole number from 1 to 5, drawn as that many filled lucide `Star` icons with a label ("5 out of 5 stars"); the converter has no number field and no filled star.
- `testimonial6`: hand-finished as `testimonial17` (star rating a required whole number from 1 to 5, filled lucide `Star` icons with a label); each testimonial is drawn by a helper component the converter cannot pass a whole item to. The quote is a `blockquote` in a `figure`, not a heading as in Relume. The company logo is a required image drawn in white on a Dark theme (`blockLogoClassName`); Relume's empty divider line is left out.
- `faq1`: the questions open and close in the Starter's own accordion (`@/components/ui/accordion`, a Client Component, so the renderer stays on the server), restyled to the Relume accordion; the single contact button is the shared `buttons` array (at most one).
- `faq7`: the single contact button is the shared `buttons` array (at most one), which the converter cannot model.
- `contact18`: a contact section without a form, which the converter refuses with the whole contact category; its three contacts are named fields (`email`, `phone`, `office`), each with the original's fixed lucide icon (`Mail`, `Phone`, `MapPin`) and a link in the shared `button` object, so `mailto:` and `tel:` work.
- `contact13`: a contact section without a form, refused like `contact18`; `email` and `phone` are named fields with a `button` link, `office` has the address and a "Get Directions" link-style button in its own `buttons` array (at most one), each with the original's fixed lucide icon.
- `logo3`: the original asks for 16 logos, 8 of them only repeats that make its loop seamless; here editors enter each logo once in one `logos` list (at least 4) and the renderer repeats the set as often as a 2560px screen needs (each logo is drawn at a fixed height, 56px on a desktop, and its own width, whatever the size of its file, so the count holds for a small file too), with the repeats `aria-hidden` and without alt text. The click-to-edit target is the whole row (the `logos` list), which stands still: a target on each sliding logo would move under the pointer, and Studio's outline of one at the screen's edge widens the page. The loop is `animate-loop-horizontally` at Relume's speed (20 seconds per eight logos, so the duration follows the number of logos). With reduced motion the first set wraps and is centred and the repeats are hidden (`motion-reduce:` classes), so no logo is cut off. The loop can be paused (WCAG 2.2.2): every set stops, together and where it stands, while the pointer is over the row, while keyboard focus is on anything in the block but the pause button, and while that button is pressed. The button is the only browser part (`logo3.client.tsx`): first in the block and always shown while the logos move, so touch users can pause too; a small round icon button (24px, with a 44px tap area) in the block's top right corner, inside its top padding, whose pause or play icon and accessible name ("Pause logos", "Play logos") switch; it marks itself `data-paused`, which the server renderer's `group-has-[[data-paused]]` classes read, and it is not drawn with reduced motion. No field controls it. On a Dark theme the logos are drawn in white (`blockLogoClassName` from `block-image.tsx`, shared with the generated logo blocks), since logo artwork is usually dark on a transparent ground.
- `faq3`: hand-finished as `faq1` (the Starter's accordion restyled to Relume's, the single contact button as the shared `buttons` array of at most one), in two columns.
- `team2`: hand-finished as `team1`, with a large square photo per member.
- `pricing2`: hand-finished as `pricing18`, with one plan in a `plan` object (its features label, such as "Includes:", is an optional field) and the original's fixed lucide `Box` icon.
- `timeline1`: each entry is drawn by a helper component with a heading and a scroll-linked dot, which the converter cannot carry over; the date is plain text (a year, a month, a span), drawn as a `<p>` so the entry's heading is its `<h3>`. Only the dot runs in the browser (`timeline1.client.tsx`): a filled layer fades in when the line reaches it, held filled with reduced motion, when the line's pinned part is also hidden. The line's column clips and fades it (`overflow-clip`, a mask) in place of Relume's background-coloured covers, which reached into the block above.
- `gallery5`: each Relume image carries a `url`, only a placeholder (`#`) for Relume's image lightbox, not a destination, so the images are plain pictures with alt text and no link.
- `faq6`: hand-finished as `faq3` (the Starter's accordion, the single contact button as the shared `buttons` array of at most one), with each question in its own card (the class map's card classes) and Relume's plus icon (lucide `Plus`, a child of the Starter's trigger, whose own chevron is hidden), which turns 45 degrees into a cross when the question opens.
- `testimonial18`: hand-finished as `testimonial17` (star rating a required whole number from 1 to 5, filled lucide `Star` icons with a label), with the cards in CSS masonry columns (`columns-*`, each card `break-inside-avoid`), as in Relume.
- `cta57`: Relume's `headers: string[]` is `headingLines`, a list of one to three required strings drawn as the lines of one `<h2>` (click-to-edit on the whole heading), each sliding in from alternating sides once it scrolls into view (`cta57.client.tsx`, held still with reduced motion). The space under the heading sits under the `<h2>`, not under every line but the first as in Relume, so three lines space as two do.
- `event9`: each event card is drawn by a helper component the converter cannot pass a whole event to. The event's `url` string and its "View event" button are one required `link` in the shared `button` object (label and destination); the photo and the title link there too, the photo left out of the tab order since it repeats the title's link. The date is a required date field, printed as the original's weekday, day and month with year (in UTC, inside a `<time>`), and its day is text, not a heading. Relume's `Badge` is a `<p>` with the badge classes (`bg-muted`, `rounded-control`). The single "View all" button is a `buttons` array of at most one, drawn beside the heading from `md` up and under the events on a phone, as in the original.
- `layout422`: Relume opens a panel with `AnimatePresence` and a `height` animation, which the converter cannot hold still for reduced motion. Here the panel's text stays mounted and Motion animates it between Relume's `slideVariants` states, and the panel opens on keyboard focus as well as on hover, so its link can be reached. With reduced motion every panel stays open and keeps its width (`motion-reduce:` classes). Each panel's `url` and unlabelled button are one `buttons` array of at most one: the whole panel links to its destination and draws its label as a link-style button. The list holds exactly two panels, since the design is two columns. The block is drawn in the browser (`layout422.client.tsx`) behind a server entry that keeps its content rule.
- `header103`: a hero with no heading of its own: two to four tabs (label, heading, description, buttons, photo; the heading is required in each), which the converter cannot model. Drawn in the browser (`header103.client.tsx`). The open tab's bar fills with Relume's spring through a Motion value, then the next tab opens and its text rises in. Unlike Relume, the rotation pauses while the pointer is over the hero or focus is inside it, and stops once a visitor picks a tab (WCAG 2.2.2); with reduced motion nothing moves on by itself, and the open tab's bar is full. Every tab's photo is drawn under the scrim, the open one shown, so the next is loaded before it opens. Tab labels over the photo stay full `text-foreground` (Relume greys the inactive ones, which would fall below 4.5:1 over the scrim); the bar marks the open tab. Each tab's heading follows `leadsPage`; only the open tab's is in the page.
- `layout348`: a feature section with no heading of its own: at least two features (tagline, heading, description, buttons, photo; the heading is required in each), which the converter cannot model, with code before its return (an `IntersectionObserver`). Drawn in the browser (`layout348.client.tsx`). Relume keeps the pinned photos in a second `images` list that repeats the features' photos; here each feature holds one photo, drawn pinned on a desktop and under its text on a phone. The open feature is the one crossing the middle of the screen (`rootMargin: "-50% 0px -50% 0px"`), so a feature taller than the screen still counts, where Relume's half-visible threshold would miss it. Relume's ground for features 0 and 2 (`bg-scheme-foreground`, which maps to `bg-card`, the same white as the Light ground) is `bg-muted` for every even feature, so the change shows on both themes; nothing moves, and the ground's fade is instant with reduced motion. Each photo fills a square frame (`aspect-square object-cover`), as Relume's square placeholder does, whatever the photo's own shape.
- `layout488`: the heading is two required fields, `headingStart` and `headingEnd` (Relume's left, right and mobile headings say the same words twice), drawn as halves around the photo on a desktop and as one line on a phone, each `aria-hidden`, with one visually hidden `<h2>` for screen readers. The circle that widens behind the photo has its full size (200vw, 250vw on a phone) and Motion scales it, in place of Relume's animated width and height; it is a window onto a required `backgroundImage`: a copy of the whole screen (the photo under `bg-background/55`, the heading and the round photo) in a `block-scene-dark` layer above the page (`z-20`, over the heading's `z-10`), clipped by `clip-path: circle()` whose radius grows from the round photo's size (`min(12rem, 14vw)`) by up to 75vmax, so the heading turns to the Dark foreground where the circle passes over it. With reduced motion the screen is not pinned, the photo and halves rest where they end, and the circle is not drawn. On a desktop each half is a size container (`@container`), and each half's type follows its own length: its text `<span>` sets `--heading-chars` to that half's length (stega characters excluded), and the size is `300cqi / (chars × 0.7)` (about three lines of its side), between 2rem and the screen-scaled 6rem, so a long phrase is drawn smaller instead of wrapping word by word.
- `layout351`: Relume's `columnText` (the "01" over each column) is the feature's place in the list, not a field, and its `verticalText` and `horizontalText` are one `label`. Each feature's column strip is a `<button>` with `aria-expanded` that opens its panel (a `region`, `inert` while closed); one is open at a time, the first to start with. CSS animates the open column's `flex-grow` and the open row's grid track in place of Relume's Motion width and height and `useMediaQuery`, so the server draws the right form for every screen and reduced motion only switches the transitions off. At most 5 features, so the open one keeps its 40rem on a laptop.
- `layout487`: each feature is drawn once and placed by CSS (a grid of half-screen rows, each feature two rows tall, left or right by its place in the list) in place of Relume's two copies of the list; the features are `features`, not `contentBlocks`. The pinned frame holds every feature's image and fades between them, in place of Relume's swapped `src`. A feature's fade follows its own scroll position in a component of its own (`Layout487Feature`), so no hook runs in a loop. With reduced motion the frame is not drawn and the features stand in three columns, each with its own image, as on a phone.
- `header83`: converted, then its text layer changed by hand in `header83.client.tsx`. The layer covers the whole screen above the photos, so Studio's click-to-edit never reached a photo. The layer lets the pointer through; only the text takes it, and only while it shows (`pointerEvents` follows the text's fade).
