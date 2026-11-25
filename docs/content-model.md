# Content model

The Website reads structured content from one Sanity project and dataset.

## Routed content

- `homePage` owns `/`.
- `page` owns normal page slugs such as `/about/`.
- `blogIndex` owns `/blog/`.
- `post` owns `/blog/<slug>/`.
- `category` owns `/blog/category/<slug>/`.
- `redirect` maps an old path to routed content or an external URL.

## Shared content

- `settings`, `navigation`, `footer`, and `blogPostSettings` are global documents.
- `faq` and `testimonial` are reusable records.
- Pages compose top-level blocks through their `blocks` array.
- `homePage`, `page`, and `blogIndex` also carry a `blocksArchive` array that
  accepts the same block types. Replaced Scaffolds move there. The Website
  reads only `blocks`.

## Resort content

What changes often is a record or a field an editor changes in one place.
Every page that shows it reads that record; never type the same fact into a
block.

| Type | Holds | Feeds |
| --- | --- | --- |
| `event` | One dated event: kind (themed weekend, live music, other), name, dates, summary, photo, itinerary by day, prices, what to bring, places on the map, big annual event switch | Event pages, Home, Today at the Cove, Events, the calendar |
| `weeklySchedule` (single) | The activities and club meetings that repeat each weekday | Today at the Cove, Clubs |
| `specialsWeek` | The specials at Cheeks for one week, keyed by its Monday: a special per day, and the happy hour | Menus & Specials, Today at the Cove, event pages |
| `venue` | A place to eat or drink: description, phone, hours, menus as text, PDF fallback, map location | Dining, Menus & Specials |
| `todayStatus` (single) | Staff-entered pool, hot tub and lake conditions, and pool hours. "Updated at" is the record's own update time | Today at the Cove |
| `accommodation` | A villa room type, campground site type or RV site type: photos, description, features, from-price, seasonal rates | Stay, Campground & RV Park, Home |
| `rateTable` | A reusable list of prices (day visit fees, membership dues) | Any page that quotes those prices |
| `offer` | A special offer: title, summary, terms, dates, coupon code, button | Offer strips, Special Offers |
| `mapLocation` | A map pin: name, blurb, photos, position on the aerial photo, optional button | Interactive Map, event pages |
| `resortMap` (single) | The aerial photo behind the map | Interactive Map |
| `propertyListing` | A home or lot for sale or rent: photos, price, status, description, contact | Live Here |
| `newsletterIssue` | One newsletter issue: date, title, link or PDF | Newsletter, Today at the Cove |
| `product` | A store item: name, SKU, category, photos, descriptions, price, weight, shipping category, options, Featured, New, Sold out | Store |
| `productCategory` | A group of products | Store |
| `storeIndex` (single) | The store page's heading and SEO fields | Store |

Rules that hold across these types:

- A dated thing is an `event`. A thing that repeats every week goes in
  `weeklySchedule`.
- The specials on an event page are not stored on the event. They come from
  the `specialsWeek` whose week covers the event.
- Opening hours use the shared `openingHours` object everywhere: rows of a
  days label and an hours text.
- A price a cart or a "from" label computes with is a number (`product.price`,
  `accommodation.fromPrice`, `propertyListing.price`). A price shown as
  written is text (`rateRow.price`, specials, menu items).
- A product's options mirror FoxyCart's option modifiers: each value may
  change the price, the weight and the SKU. There is no record per variant.
- `product.shippingCategory` comes from the `SHIPPING_CATEGORIES` list in the
  product schema. Each value must match a category code in the FoxyCart
  admin.
- FoxyCart keeps no stock count. Sold out is a switch on the product and on
  each option value.
- `product.details` and `propertyListing.details` are the long rich-text
  descriptions. They are not named `description` because that name is plain
  text on every other type, and queries that read it across types rely on
  that.
- `settings` holds the Book Now, Buy Day Pass and login links, the review
  rating, and the site-wide banner.

## Block library

This is the text list of every block an editor can insert on a page. Agents
that edit content get this list, so keep it current: update it in the same
change that adds, removes, renames, or changes a block.
`studio/schemas/blocks/block-library.test.mjs` fails when it names different
blocks than `studio/schemas/blocks/page-builder.ts`.

Each entry starts with the block's `_type`. Every block has one design;
the only look setting is `theme` (Light or Dark background) where a block
has one.

- `richTextBlock` (Rich Text). Long-form editorial content with an optional
  label, heading and introduction. Use it for running text, and as a valid
  final match for a Scaffold. Available on every page.
- `scaffold` (Scaffold). A placeholder with `name`, `richText`, and
  `proposedBlockShape`. It renders its rich text with a visible internal
  marker so nobody mistakes it for a finished block, and a published page
  must not contain one. Use it only while drafting a page. Available on every
  page.

### Blocks converted from Relume

Each of these is one Relume library component, converted by
`pnpm relume:convert` (see `docs/agents/relume-import.md`). The `_type` is
`relume` plus the Relume name, so `relumeLayout16` is Relume's Layout 16. The
tags after the name say what the layout looks like.

- `relumeHeader103` (Header 103). Relume hero header section: 1 column, text align center, buttons, background image, tabs. A full-screen hero of two to four tabs, each with its own photo behind centred text; a bar under each tab's label fills, then the next tab opens by itself, and a visitor can pick a tab. Fields: tabs (each: label, shown in the row of tabs at the bottom; heading; description; up to 2 buttons; image). Use it as a page's opening when a few messages of equal weight share the first screen, such as the stages of a service. Available on every page.
- `relumeLayout488` (Layout 488). Relume feature section: text align center, image/video center, 1 column, image. A two-part heading with a round photo between its halves, each half drawn very large for a word or two and smaller for a longer phrase (each half's size follows its own length, so it holds to about three lines); as the visitor scrolls, the block holds the screen while the photo grows from a dot and the halves slide into place, then a circle widens from behind the photo, revealing a background photo under a dark layer with the heading in light text, until it fills the screen. On a phone the photo sits above the whole heading. Fields: heading, first part; image (shown as a circle); heading, second part (each part up to 40 characters; shorter is bigger); background photo (a wide photo, seen through the widening circle). Use it as a bold pause between sections, for a short statement that a single photo sums up. Available on every page.
- `relumeLayout348` (Layout 348). Relume feature section: text align left, 2 columns, image/video left, buttons, multiple images. Features scroll past a pinned photo on the left; on a desktop each feature fills a screen, and the photo changes to the feature in the middle of the screen while the ground turns quiet grey for every other feature. On a phone each feature shows its photo under its text. Fields: features, at least 2 (each: tagline, heading, description, up to 2 buttons, image). Use it to walk through a few features, steps or services, each with a photo of its own. Available on every page.
- `relumeTestimonial18` (Testimonial 18). Relume testimonial section: 3 columns, text align center, text align left, avatar image, star rating, reviews section. A centred heading over testimonial cards stacked in masonry columns, so quotes of different lengths fit together. Fields: heading, description, testimonials (each: rating (1 to 5 stars), quote, avatar, name, job title, company name). Available on every page.
- `relumeGallery24` (Gallery 24). Relume gallery section: text align center, 1 column, multiple images, image, gallery section. Fields: heading, description, images (images). Available on every page.
- `relumeEvent9` (Event 9). Relume event section: 3 columns, text align left, buttons, date, tags, multiple images. A heading on the left with a "View all" button on the right, above a grid of event cards (one across on a phone, two on a tablet, three on a wide screen); each card is a photo with the date on it (weekday, day, month and year), a category tag, the event's title, its location, a description and a "View event" link, and the photo and title link to the event too. Fields: tagline, heading, description, up to 1 button, events (each: image, date, category, title, location, description, link with its label). Use it for a list of upcoming events. Available on every page.
- `relumeCta57` (CTA 57). Relume cta section: 1 column, text align center, buttons, text only, cta section. A centred call to action whose heading lines slide in from alternating sides as it scrolls into view. Fields: heading lines (1 to 3, together the heading), description, up to 2 buttons. Use it for a closing call to action with a little movement. Available on every page.
- `relumeLayout422` (Layout 422). Relume feature section: 2 columns, text align center, text align left, multiple images, background image, image. A centred heading above two tall photo panels side by side, each with a tagline and heading in white over a dark layer; on a desktop the panel under the pointer widens, darkens and slides up its description and link, while on a phone both are always shown. Each whole panel links to its button's destination. Fields: tagline, heading, description, features (exactly two panels, each: image, tagline, heading, description, up to 1 button). Use it to send visitors down one of two paths, such as two services or two audiences. Available on every page.
- `relumeLayout351` (Layout 351). Relume feature section: text align left, accordion, image, benefits section, services section. A tagline, heading and description above one card of numbered features; on a desktop the features are narrow columns with their label read upwards, and the one a visitor clicks opens wide to show its heading, description and photo; on a phone they are rows that open one at a time. The first starts open. Fields: tagline, heading, description, features (1 to 5, each: label, heading, description, image). Use it for three to five services or benefits that each deserve a photo but need not all show at once. Available on every page.
- `relumeLayout487` (Layout 487). Relume feature section: text align left, 3 columns, image/video center, buttons, multiple images, image. A centred tagline, heading and description, then, on a tablet or desktop, a tall photo pinned in the middle while the features scroll past, taking turns left and right; each fades in as it nears the middle of the screen and the photo changes to its own. On a phone the features are one column, each under its own photo. Fields: tagline, heading, description, features (each: tagline, heading, description, up to 2 buttons, image, tall 2:3). Use it for three to six steps or features told in order, each with its own photo. Available on every page.
- `relumeFaq6` (FAQ 6). Relume faq section: 2 columns, text align left, buttons, text only, accordion, faq section. The heading, description and button on the left; on the right each question in its own card, opening to show its answer, with a plus that turns into a cross. Fields: heading, description, up to 1 button, questions (each: title, the question; answer). Available on every page.
- `relumeHeader83` (Header 83). Relume hero header section: 1 column, text align center, image/video center, buttons, multiple images, background image. A full-screen hero: a centred heading, description and buttons in white over one photo under a dark layer; on scroll the text fades and the photo shrinks back to show it was the middle one of a three by three grid of photos. On a phone only three of the nine show, in one column. Fields: heading, description, up to 2 buttons, images (exactly 9 images; the fifth is the one behind the text). Available on every page.
<!-- relume-blocks: `pnpm relume:convert` adds entries above this line -->

The Starter shipped Rich Text and Scaffold and presumes no design. Every other
block belongs to this project: take one from the Starter's Relume shelf with
`pnpm relume:add <slug>`, or generate one with `pnpm page-builder:new`, then
add it to this list.

## Page Builder path

Each block has one shared `_type` across its Studio schema, Page Builder registration, GROQ projection, generated TypeScript type, and React renderer. See `docs/agents/page-builder.md` for the extension steps.

Sanity owns authored content. The repository owns schemas, queries, rendering, routing rules, and generated types.
