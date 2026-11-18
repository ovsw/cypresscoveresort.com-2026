# Product

Cypress Cove Resort website (2026 redesign). A marketing and information site for a family-owned nudist resort in Kissimmee, Florida, open since 1964: about 300 acres, a 50-acre lake, 84 villa rooms, a campground and RV park, two heated pools, three places to eat and drink, about 20 clubs, and a themed weekend every weekend. Thirty minutes from the Orlando theme parks, open all year.

Pre-filled on 2026-11-13 from the approved design brief (`docs/design-brief.md`) and the strategy workshops with the client. The visual direction for the current round lives in the brief, not here.

## Platform

web

## Stack

- Current round: static HTML and CSS design concepts in `design/`, each a full design with its own HTML and CSS in its own folder. No build step.
- Production: Next.js + Sanity CMS. Sections become reusable components that non-technical editors fill in the CMS, so every section must survive text that grows or shrinks.
- Booking runs in an external engine (RDP IRMng). "Book Now" links out. No availability, dates or live rates on the site.
- Fonts: Google Fonts only.

## Users

Priority order; the first group wins any conflict.

1. **Curious first-timers.** New to naturism, core age 45–60, almost all from the US, nervous. Need reassurance, plain facts and a clear next step.
2. **Experienced naturists comparing resorts.** Know nudist resorts, may not know how the Cove differs. Need the claim, the proof and a comparison. Roughly two thirds of the homepage's prospective audience.
3. **Members and regulars.** Many aged 60–75, snowbirds. Served by a separate "Today at the Cove" page, not the homepage.
4. **Guests on site or arriving soon**, and **young adults 18–35** (the growth segment).
5. Residents, local day visitors, singles, groups and press get one page or one line each.

More than half of visits are on a phone. Tech comfort is low to medium. Many readers wear glasses; some read English as a second language.

## Product Purpose

1. **Win new guests.** The homepage speaks only to people who don't come yet. Primary action: Book Now. Then tour requests, then day passes.
2. **Serve existing guests.** "Today at the Cove": specials, what's on, conditions, this week's events. Reached by QR code, newsletter and home-screen shortcut.
3. **Take load off the front desk.** Rules, prices, hours, directions, menus and events as pages the staff can keep current in minutes.

The conversion ladder: free tour → day visit → overnight stay → membership.

## Positioning

- The problem: a nudist holiday usually means a drop in quality. Most nudist resorts are co-ops or RV communities with modest facilities.
- The answer: a top-tier resort that is also a nudist resort. Scale, high-end rooms, pools, lake, three restaurants, a full activities and events programme, and guest service people come back for.
- The other half of the promise: strict family-naturist standards. Guests vetted at the gate, no photography, no sexualised behaviour.
- The site is judged first against other nudist resorts' sites, then against upscale resort sites. The client wants it to be the best in its category again.

## Operating Context

- Events are the heartbeat: themed weekends, live music and food specials give regulars a reason to return and newcomers a date to aim for.
- High season is winter; launch content is winter content.
- Photography is in transition. Buildings were repainted and grounds relandscaped in 2026; most older photos show the old look. New neutral-processed photos are in `assets/recent/`; a professional shoot is planned. Until then, photos are placeholders.
- Marketing speaks to couples and families.

## Capabilities and Constraints

- Sitemap (34 pages), navigation and homepage section order are approved by the client. Design the look; don't add, drop or reorder sections.
- Main navigation: First Visit · Stay · Play · Events · Shop · Contact, plus two buttons: Today (secondary) and Book Now (primary). No login in the header; "Member and Resident Login" is a footer link.
- Testimonials: many, in rows, never a carousel.
- First-timer questions are shown with full answers, not hidden in an accordion.
- Prices are shown plainly on pages.
- Protect search rankings: keep content depth and existing URLs.

## Brand Commitments

- The client's phrase for the resort: **"fun and festive"**, and the site must also feel **premium**. A Key West resort, never a summer camp.
- Calm, not busy.
- Tone: warm, welcoming, reassuring, with a light wink. Firm on the rules. No "premier" or "best" without a fact behind it.
- Photo rules, strict: real resort photos only, no AI-generated people. No explicit nudity, nothing suggestive, never children in a nude context. People clothed, cropped, from behind or at a distance. The site must look like a normal upscale resort, safe for ads and social previews.
- Show real ages: people in their 40s to 70s and families.
- Never use "swingers", "lifestyle" or "adult resort". Use "clothing optional" with care: pools and hot tubs are nude only.
- Logo: `design/img/logo.svg` is a single-colour working version. A refreshed web lockup will replace it.

## Evidence on Hand

- `docs/design-brief.md` — the approved brief for this round: direction, the common base, the two concepts, references and the avoid list.
- `docs/homepage-copy.md` — homepage copy from the approved wireframe.
- `docs/photo-manifest.md` — the selected photos, what each shows and where it is used.
- `assets/recent/` — 2026 photos and logos. `assets/old-site/` — photos from the current site (`best/INDEX.md` lists them; files marked `--nudity` must not be used).

## Product Principles

1. One audience per page. The homepage is for people who don't come yet.
2. Structure before style. The section order encodes who is reading and what they need next; restyle it, don't rearrange it.
3. Proof over claims: reviews, ratings, photos and comparisons carry the argument.
4. One obvious action per screen.
5. Plain labels. Never rely on an icon alone.

## Accessibility & Inclusion

- Text contrast at WCAG AA or better.
- Base text about 18px on desktop. No thin or high-contrast typefaces at small sizes.
- Tap targets at least 44px. No hidden gestures.
- Plain English, short sentences.
