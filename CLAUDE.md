<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `frontend/node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## This repository

`cypresscoveresort.com-2026` holds the Website and Studio for Cypress Cove
Resort (cypresscoveresort.com), bootstrapped from the OVS Next.js + Sanity
Starter on 2026-11-18.

- Website: Next.js in `frontend/`. Vercel project `cypresscoveresort-com-2026`
  (team Studio ROVST), live at https://cypresscoveresort-com-2026.vercel.app
  until launch. `NEXT_PUBLIC_SITE_ENV` is `staging` there, so search engines
  stay out; set it to `production` at launch.
- Studio: Sanity Studio in `studio/`, deployed at
  `cypresscoveresort.sanity.studio`.
- Sanity project `nti19jbz` ("cypresscoveresort.com-2026", organization
  "Cypress Cove Resort"), dataset `production`. Default branch `main`.
- The dataset holds the Starter sample content (`pnpm seed`). Remove it with
  `pnpm unseed` before adding real content.
- The styles, logo files and photos are placeholders from the Starter. Do not
  restyle them; the chosen design concept replaces them.
- `pre-bootstrap/` holds the design round from before the code bootstrap (the
  homepage concepts, the brief, the approved copy, the photo manifest). Read
  `pre-bootstrap/CLAUDE.md` before working in it. `PRODUCT.md` and
  `.impeccable/` at the root belong to the Impeccable design tool.
- `assets/` is the local photo archive (about 1.5 GB), ignored by git.
- Never commit prices, contract terms, payments, personal contact details, or
  secrets.

## Dev Server rules
Before starting a development server, inspect the required port. If the exact server you need is already running there, reuse it.

## Shell discipline and reporting observations

The Bash tool's working directory **persists between calls**. A `cd` in one
command silently changes what every later relative path resolves to. This has
already produced confidently-wrong claims about missing files.

- Run every command from a known cwd: use absolute paths, or `cd` to the repo
  root first. Never rely on inherited shell state.
- Do not use `2>/dev/null` on any command whose output feeds a conclusion. A
  suppressed error and an empty result look identical and mean different things.
- Do not chain independent checks with `&&` — the first failure hides every
  check after it. Use `;` or separate calls.
- **Never report a file as missing, deleted, or changed on the strength of one
  failed check.** Re-verify from an absolute path first.
- Report what was observed, not what was inferred: "the check returned nothing"
  is a different claim from "the file does not exist." Never attribute a change
  to the user's actions without direct evidence.
- When a new result contradicts an earlier observation in the same session,
  stop and re-verify. The newer result is not automatically the correct one.

This matters most before destructive or delegated work: unverified claims about
environment state (which dataset is configured, which env file is loaded) are
exactly what makes handing off write access dangerous.

## Testing
- Prefer focused functional/accessibility checks and one-time visual inspection;
- DO NOT create or maintain screenshot baselines unless explicitly requested.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): summary`.

- Common types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`, `build`, `ci`.
- Scope is optional but preferred when the change is confined to one area — e.g. `feat(header):`, `fix(studio):`.
- Summary is imperative and lowercase: "add", not "added" or "Adds".
- Keep explaining *why* in the body. The prefix classifies the change; it does not replace the reasoning.
- Note that commits predating this rule use plain imperative subjects with no prefix. Follow the convention above, not the older style.

## Agent skills

### Issue tracker

Issues and PRDs are tracked in this repository's GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the canonical labels `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This repository uses a single-context domain-doc layout. See `docs/agents/domain.md`.

### Page Builder work

Before adding or changing a Page Builder block, read `docs/agents/page-builder.md`.

**One block, one design.** A block has exactly one layout. The only
setting that may change how it looks is the shared `theme` field (its
background colour: Light or Dark). Never add any other field that changes a
block's look: no `layout`, `variant`, `style`, `design` or `appearance`
field, and no image-position, alignment, column-count, "reverse" or size
switch either, whatever its name. Never add a `hidden` rule keyed on a design.
A second design is a second block with its own `_type`, fields and preview
thumbnail.

Why:

- Content editors are not designers. They choose content and the order of
  blocks; the code owns the design.
- The catalogue thumbnail must tell an editor exactly what the block will
  look like on the page. A thumbnail shows one layout, so a block with
  several layouts makes its thumbnail a lie.

An exception needs Ovi's express approval before the work starts. See
`docs/adr/0001-one-block-one-design.md`;
`studio/schemas/blocks/one-block-one-design.test.mjs` enforces the field
names.

**Keep the block library list current.** `docs/content-model.md`, "Block
library", is the text list of blocks that content-editing agents are given.
Whenever you add, remove, rename, or change a block, update its entry in the
same change. `studio/schemas/blocks/block-library.test.mjs` fails when the
list and the code name different blocks.

### Development workflow

Before changing workspace dependencies, Sanity schemas, GROQ queries, or development scripts, consult the relevant section of `README.md`.

### Raster image descriptions

Before syncing Raster descriptions or configuring Raster credentials, read
`docs/agents/raster-descriptions.md`. For a few images, write each
description yourself. Use Raster only for large batches.
