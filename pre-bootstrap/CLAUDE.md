# Cypress Cove Resort website, 2026 redesign

This folder holds the design round from before the code bootstrap: two full designs ("concepts") for the homepage, as static HTML and CSS with no build step. The Next.js and Sanity site lives at the repository root. Paths below are relative to this folder (`pre-bootstrap/`), except `PRODUCT.md`, `.impeccable/` and `assets/`, which stay at the repository root.

## Read first

- `PRODUCT.md`: the product, the audience and the brand rules. Read it before any design or copy work.
- `docs/design-brief.md`: the approved brief for this round, with both concepts and the avoid list. The Basecamp document is the source of truth; this is a local copy, kept out of git (this repository is public).
- `docs/homepage-copy.md`: read when a headline or paragraph is in question. The copy is client-approved.
- `docs/photo-manifest.md`: read before choosing, cropping or swapping a photo. It lists what each photo shows and which ones need Ovi's check.

## Scope of this round

Desktop only, 1440px wide. Phone and tablet layouts belong to the next round.

## How the concepts are built

Each concept is a complete design of its own, never a theme over a shared page.

- **The wireframe fixes content only.** `docs/homepage-copy.md` and the section list in the brief say which sections there are and in what order, what copy goes in each, how many items a list has, what they say, and where a photo belongs. They say nothing about layout or look.
- **Everything else is free in each concept:** markup, layout, grid, composition, components, type, colour, icons, motion and photo grade, within the brief's client rules and avoid list.
- **Each concept has its own folder with its own HTML and CSS:** `design/concept-a2/` (Gold & Green) and `design/concept-b/` (Island Colours). The homepage is `index.html` in that folder; `notes.html` beside it holds the palette, type, buttons and rationale.
- **Directions, picked by Ovi on 2026-11-13 from three dealt per concept:** A2 is "Golden Hour" (the page runs through one day at the resort; gold is only ever light). B is "House Colours" (each building colour has one job: yellow for staying, blue for water and daytime, pink for evenings, sage for the gate and the first visit). Each direction's contract is in `.impeccable/surfaces/design-concept-a2-index-html.md` and `.impeccable/surfaces/design-concept-b-index-html.md`; read it before changing that concept.
- Concepts share nothing but the photos in `design/img/`. Don't build one by restyling another's markup or by overriding variables.

### Concept A1: the first, experimental version (frozen)

The first Gold & Green build (made with Impeccable 4.5 on 2026-11-13) is kept as **Concept A1, experimental**. It was built as a theme on a shared page, and its look was picked without showing alternatives. **Concept A2** replaces it: same brief (Gold & Green), designed from scratch.

- A1 is every file directly in `design/` and `design/css/`: `index.html`, `concept-a.html`, `css/base.css`, `css/theme-a.css`, the empty `css/theme-b.css`, plus a standalone copy (`concept-a1.html`, `concept-a1-notes.html`, `css/a1/`). Never edit any of them.
- Its export is `design/exports/concept-a1-experimental-homepage-1440.png`.
- The concepts going to the client are A2 and B.

## Viewing a page

Open the file in a browser, or serve the folder for the preview tab:

```
cd design && python3 -m http.server 4311 --bind 127.0.0.1
```

Then open `http://localhost:4311/concept-a2/index.html` or `http://localhost:4311/concept-b/index.html`. Fonts come from Google Fonts, so the page needs a network connection to look right.

## Capturing a page

```
node scripts/capture.cjs <page> <output.png>
node scripts/capture.cjs concept-a2/index.html design/exports/concept-a2-homepage-1440.png
node scripts/capture.cjs concept-b/index.html design/exports/concept-b-homepage-1440.png
```

The script loads the page from disk (no server), waits for fonts and images, and writes one full-length PNG at 1440px. Read what it prints: `fonts: NONE LOADED` or a `horizontal overflow` line means the capture is not fit to send.

- `design/exports/` holds the captures that go to the client, named `concept-<letter>-<page>-1440.png`. Re-run the capture after any change to a concept, so the PNG matches the page.
- `.impeccable/review/` is scratch space for review captures.

## Photos

- `assets/` is the full photo archive (about 1.5 GB). It stays on this machine and is ignored by git.
- A photo the design uses is copied into `design/img/` and given a row in `docs/photo-manifest.md`.
- Leave the photo files as they are. Colour grading is done in each concept's own CSS.

## Impeccable

- `.impeccable/surfaces/design-concept-a1-html.md` is the direction contract for the frozen Concept A1 only. A2 and B follow the brief, not that file.
- There is no `DESIGN.md` on purpose. It gets written once the client has picked A, B or a mix; written earlier, it would pull the other concept toward one look.
