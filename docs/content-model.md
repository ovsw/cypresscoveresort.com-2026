# Content model

The Website reads structured content from one Sanity project and dataset.

## Routed content

- `homePage` owns `/`.
- `page` owns normal page slugs such as `/about/`.
- `blogIndex` owns `/blog/`. It is the News page; the Studio calls it that.
- `post` owns `/blog/<slug>/`. Posts are News posts.
- `category` owns `/blog/category/<slug>/`.
- `redirect` maps an old path to routed content or an external URL.

`event`, `propertyListing`, `product` and `productCategory` carry a slug for
their own pages. Their routes arrive with the pages that render them, and so
does moving News to `/about/news/`.

## Shared content

- `settings`, `navigation`, `footer`, and `blogPostSettings` are global documents.
- `faq` and `testimonial` are reusable records.
- Pages compose top-level sections through their `blocks` array.
- `homePage`, `page`, and `blogIndex` also carry a `blocksArchive` array that
  accepts the same section types. Replaced Scaffolds move there. The Website
  reads only `blocks`.

## Resort content

What changes often is a record or a field an editor changes in one place.
Every page that shows it reads that record; never type the same fact into a
Section.

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

## Section library

This is the text list of every section an editor can insert on a page. Agents
that edit content get this list, so keep it current: update it in the same
change that adds, removes, renames, or changes a section.
`studio/schemas/blocks/section-library.test.mjs` fails when it names different
sections than `studio/schemas/blocks/page-builder.ts`.

Each entry starts with the section's `_type`. Every section has one design;
the only look setting is `theme` (Light or Dark background) where a section
has one.

- `richTextBlock` (Rich Text). Long-form editorial content with an optional
  label, heading and introduction. Use it for running text, and as a valid
  final match for a Scaffold. Available on every page.
- `scaffold` (Scaffold). A placeholder with `name`, `richText`, and
  `proposedSectionShape`. It renders its rich text with a visible internal
  marker so nobody mistakes it for a finished section, and a published page
  must not contain one. Use it only while drafting a page. Available on every
  page.

The Starter shipped these two and presumes no design. Every other section
belongs to this project. Generate one with `pnpm page-builder:new`.

## Page Builder path

Each section has one shared `_type` across its Studio schema, Page Builder registration, GROQ projection, generated TypeScript type, and React renderer. See `docs/agents/page-builder.md` for the extension steps.

Sanity owns authored content. The repository owns schemas, queries, rendering, routing rules, and generated types.
