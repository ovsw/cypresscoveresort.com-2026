# Homepage copy (approved wireframe)

Source: Relume project "Cypress Cove Resort" (`01a16713-a374-7286-b1e8-9fda8e579ca3`), page Home (`/`), read 2026-11-13, plus the brief document "Social proof — ratings, reviews and rankings". Text is word for word.

Link targets: the Relume read tools do not return link targets (only an internal link id for the logo). Wherever a link target is listed below, it is the sitemap path of the page with the same name (marked "matched by page name"), not a value stored in the wireframe. Where no page matches, it is `[TODO: link target]`.

## Differences from the design brief

Compared with "Content and structure to design around" in `docs/design-brief.md`. Not resolved here; the wireframe is what the page follows.

Navigation
1. The wireframe menu has six items: First Visit, Stay, Play, Events, Shop, Contact. "Today" is not a menu item; it is a button in the button group, placed before "Book Now". The brief lists Today inside the menu order (between Events and Shop) and says "Today sits next to Book Now".
2. Four menu items (First Visit, Stay, Play, Events) have dropdowns with 6, 4, 6 and 4 children. The brief does not mention dropdowns. Shop and Contact have none.
3. The wireframe navbar is set to open dropdowns on hover and to stay fixed on scroll.

Footer
4. Link label is "Member & Resident Login" in the wireframe; the brief says "Member and Resident Login".
5. The wireframe footer also has: a newsletter signup ("The weekly bulletin"), contact details (address, phone, email), four link columns (Visit, Stay & Play, Events, The Resort) and three legal links. The brief lists Membership, Newsletter, Contact & Directions, legal pages and social links. In the wireframe, Membership is under Stay & Play, Newsletter under Events, Contact & Directions under The Resort. Social links are Facebook, Instagram, YouTube, TikTok.

Homepage sections
6. Section order matches the brief: all 11 sections, same order.
7. Hero: the wireframe adds a Tripadvisor score (4.7 from 797 reviews) and a second button, "Plan your first visit". The brief names only the claim, photo and Book Now.
8. Guests say: the wireframe has nine quote cards, but the social-proof document says they are provisional stand-ins until real review text is pasted in. No individual real review exists yet. The section eyebrow reads "The #1 Nudist Resort"; the social-proof document's claim is "Ranked #1 specialty lodging in Kissimmee". Ratings (Tripadvisor 4.7, Google 4.6) sit in the section's own intro line, not as a separate element.
9. First-visit offer strip: the wireframe has the free tour plus half-price day visit only. The brief also says "or a third villa night free"; that option is absent. The wireframe says "Terms to confirm with the office."
10. Before you come: the wireframe adds a "Still have a question?" block with two buttons. The answer to "Can I come on my own?" is marked `[DRAFT]` in the wireframe.
11. Couples and families: the wireframe items have a heading and text only; no photo is set. The brief calls them two side-by-side panels.
12. Brief says Ways to stay has "a starting rate" each; wireframe gives them ($207 a night, $73 a night), plus a weekly RV rate.
13. Image positions in the wireframe are empty (no photo set): hero, gallery (6), events (3), stay (2).

## Header (navbar)

Logo: links to the home page (logo image not set in wireframe).

Menu, in order (dropdown children indented; link targets matched by page name):

- First Visit (`/first-time`)
  - First-Timer's Guide (`/first-time`)
  - Day Visits & Tours (`/first-time/day-visit`)
  - Etiquette & Rules (`/first-time/nudist-etiquette-rules`)
  - FAQs (`/first-time/faqs`)
  - Special Offers & Groups (`/special-offers`)
  - Young Adults (18-35) (`/first-time/young-adults`)
- Stay (`/accommodations`)
  - All Accommodations (`/accommodations`)
  - Villas & Rooms (`/first-time/villa-rooms`)
  - Campground & RV Park (`/accommodations/campground-rv-park`)
  - Membership (`/membership`)
- Play (`/activities`)
  - Amenities & Activities (`/activities`)
  - Dining (`/dining`)
  - Menus & Specials (`/first-time/menus-specials`)
  - Clubs & Weekly Schedule (`/activities/clubs`)
  - Interactive Map (`/about/interactive-map`)
  - Gallery (`/gallery`)
- Events (`/events`)
  - What's Coming Up [TODO: link target]
  - Event Calendar (`/events/events-calendar`)
  - Big Annual Events (`/events/big-annual-events`)
  - Newsletter (`/events/newsletter`)
- Shop (`/store`)
- Contact (`/contact-directions`)

Buttons: Today (`/today`), Book Now [TODO: link target; booking runs in an external engine].

## Sections

### 1. Hero (id `hero`)

- Tagline: Kissimmee, Florida
- Heading: A top family resort. / For Nudists.
- Body: The freedom you came for, without giving up the holiday: villa rooms, three places to eat, two heated pools, a 50-acre lake and 300 acres to wander, 30 minutes from Disney. Family owned in Kissimmee since 1964.
- Rating: 4.7 — on Tripadvisor, from 797 reviews
- Buttons: Book Now [TODO: link target]; Plan your first visit [TODO: link target]
- Image: [TODO: hero photo not set in wireframe]

### 2. Why Cypress Cove (id `why`)

- Heading: You won’t have to lower your standards. Or your clothes.
- Body: Most nudist resorts are built to be nudist and little else: a pool, a clubhouse, and quiet by nine. Cypress Cove was built as a resort in 1964, and it has been run as one ever since.
- Items (4):
  1. Rooms, pools and restaurants — Villa rooms, two heated pools, hot tubs, and three places to eat and drink on the grounds, including Cheeks Bar and Grill.
  2. 300 acres and a 50-acre lake — Palm walks, free boats on the lake, golf, pickleball, tennis and a spa. Enough space that it never feels crowded.
  3. Open all year, with real service — Central Florida weather and a staffed resort every day of the year. Themed weekends, live music and something on most evenings.
  4. Everyone is vetted at the gate — Photo ID for every guest, no cameras around the pools, and firm family-nudist standards. Not a public beach, and not a lifestyle resort.
- Buttons: none visible in the wireframe.

### 3. How we compare (id `compare`)

- Heading: Forget what you know about nudist resorts
- Body: If you have been to other nudist resorts, you know the trade: somewhere to be nude in exchange for a lesser holiday. Here is the same list, side by side.
- Table. Column headers: "What a nudist resort usually gives up" | "A typical nudist resort" (sub-line: A co-op, a club or an RV park) | "Cypress Cove" (sub-line: A resort, family owned since 1964; highlighted column)

| Criterion | A typical nudist resort | Cypress Cove |
| --- | --- | --- |
| Where you sleep | Simple cabins, or your own RV | Villa rooms, studio to two-bedroom, plus a campground |
| Where you eat | A snack bar, or bring your own | Three places to eat and drink, with weekly specials |
| The evenings | Quiet after dark | Live music, themed weekends and a bar that stays open |
| The grounds | A pool and a few acres | 300 acres, two heated pools, hot tubs and a 50-acre lake |
| Who gets in | It varies | Photo ID and vetting at the gate, family standards, no cameras |

- Buttons: none visible.

### 4. Guests say (id `guests-say`)

- Tagline: The #1 Nudist Resort
- Heading: Nearly 2,000 reviews, from people who weren't sure either
- Body: 4.7 on Tripadvisor, 4.6 on Google.
- Quote cards: see "Reviews and ratings" below. The wireframe's nine cards are provisional stand-ins.
- Buttons: none visible.

### 5. See the resort (id `gallery`)

- Heading: Take a look around
- Body: The pools, the lake, the villas, the restaurants and the grounds.
- Images: 6 gallery images [TODO: photos not set in wireframe]
- Button: See the full gallery (`/gallery`, matched by page name)

### 6. What's coming up (id `coming-up`)

- Heading: What's coming up
- Body: A themed weekend most weeks, live music and specials from the kitchen. Already a guest or member? See Today at the Cove.
- Cards (3), each with tag "Themed weekend", an image [TODO: not set] and a button "View itinerary" [TODO: link target]:
  1. Winter Wonderland weekend — The resort lit up for the season: golf cart light parade, cookie decorating, a tree lighting by the pool and a holiday dance at Cheeks.
  2. Luau weekend — Hawaiian shirts, a pig roast by the lake and a Saturday night luau party at Cheeks with a live band. Leis at the gate.
  3. Retro 70s Disco weekend — Three days of disco: costume contest, poolside DJ sets and a Saturday night dance at Cheeks. Valentine's dinner at Lakeside.
- Buttons: "See all events" (`/events`, matched by page name). The Today link is named in the body text; the wireframe gives no target ([TODO: Today link, `/today` by page name]).
### 7. Ways to stay (id `stay`)

- Heading: Ways to stay
- Body: Two ways to sleep on the resort. Published 2026 rates, before tax; full details on each page.
- Options (2), each with an image [TODO: not set]:
  1. Villas and rooms — From $207 a night, studio to two-bedroom villas, day fees for two adults included. A short walk from the pools and the restaurants. Button: See the villas (`/first-time/villa-rooms`, matched by page name)
  2. Campground and RV park — From $73 a night for tent and RV sites, full hookup from $522 a week. For a night or a whole winter. Button: See the campground (`/accommodations/campground-rv-park`, matched by page name)
- Button: Book Now [TODO: link target]

### 8. First visit offer strip (id `offer`)

- Heading: First visit? Take a free tour, then come back for a half-price day.
- Body: The first-timer offer, all year. Terms to confirm with the office.
- Button: See how it works [TODO: link target]

### 9. Your first visit, step by step (id `first-visit-steps`)

- Heading: Your first visit, step by step
- Body: No pressure to undress at once. Swimsuits are fine at the lake. No cameras anywhere. First-timer offer: a free tour, then a half-price day visit.
- Steps (3):
  1. Take a free tour — Ask for a tour by phone or on the day. A staff member walks you around the grounds, clothed, and answers anything you want to ask.
  2. Come for a day — Pay the day fee at the gate with photo ID. Stay as long as you like and go at your own pace.
  3. Stay the night — A villa room or the campground. Book a weekend around an event, or a longer stay in winter.
- Buttons: Request a tour [TODO: link target]; Read the First-Timer's Guide (`/first-time`, matched by page name)

### 10. Couples and Families (id `couples-families`)

- Heading: Made for couples and for families
- Body: Two kinds of guests make up most of the resort. Both find the same thing: time together, with nothing to prove.
- Panels (2):
  1. Couples: reconnect and unplug — Quiet pools, the lake at sunset, dinner with no phone on the table. A private villa patio to come back to.
  2. Families: wholesome, safe, judgment free — Children are welcome and visit free. Every guest is vetted, cameras stay away, and the rules are the same for everyone.
- Buttons: none visible in the wireframe.

### 11. Before you come (id `questions`)

- Heading: Before you come
- Body: The five questions everyone asks before a first visit.
- Questions:
  1. Will people stare? — No. Staring is against the rules, and after the first hour most people forget anyone is undressed. You will feel more ordinary here than on a beach.
  2. Do I have to undress at once? — No. On a first visit you go at your own pace. Swimsuits are fine at the lake. The pools and hot tubs are nude.
  3. Is it a sexual place? — No. Cypress Cove is a family nudist resort. Sexual behaviour is not tolerated, every guest is vetted at the gate, and cameras stay away from the pools and the grounds.
  4. Can I come on my own? — [DRAFT] Single visitors are welcome under the singles policy. The exact wording is confirmed with the office and appears the same way everywhere on the site.
  5. Can I bring the kids? — Yes. Children are welcome and visit free with a parent. Families are a large part of the resort.
- Closing block: Still have a question? — Read the full list, or call (888) 683-3140 and ask anything.
- Buttons: Read the full FAQ (`/first-time/faqs`, matched by page name); Call (888) 683-3140 (phone link)

## Footer

- Newsletter signup: heading "The weekly bulletin"; text "What's on this week, the menus and the specials, straight from the resort. One email a week."; email field placeholder "Your email address"; button "Subscribe"; success "You are on the list. Look for the bulletin on Thursday."; error "That did not send. Try again, or email relax@cypresscoveresort.com."
- Contact details: Address — 4425 Pleasant Hill Road, Kissimmee, FL 34746; Phone — (888) 683-3140; Email — relax@cypresscoveresort.com
- Social: Facebook, Instagram, YouTube, TikTok [TODO: profile URLs]
- Link columns (targets matched by page name):
  - Visit: First-Timer's Guide; Day Visits & Tours; Etiquette & Rules; FAQs; Special Offers & Groups; Testimonials (`/first-time/testimonials`); Young Adults (18-35)
  - Stay & Play: Villas & Rooms; Campground & RV Park; Membership; Amenities & Activities; Dining; Menus & Specials; Interactive Map; Gallery
  - Events: What's Coming Up [TODO: link target]; Event Calendar; Big Annual Events; Newsletter; News (`/about/news`)
  - The Resort: Today at the Cove (`/today`); Live Here (`/live-here`); About (`/about`); Our Story (`/about/history-of-cypress-cove`); Contact & Directions (`/contact-directions`); Shop (`/store`); Member & Resident Login [TODO: link target]
- Legal links: Privacy Policy (`/legal/privacy-policy`); Terms & Return Policy (`/legal/terms-return-policy`); Water Quality Report (`/legal/water-quality-report`)
- Copyright: Cypress Cove Nudist Resort. All rights reserved.

## Reviews and ratings

From the brief document "Social proof — ratings, reviews and rankings" (supplied 2026-11-10). Use these figures exactly; never round the written score.

- Tripadvisor: 4.7 out of 5, 797 reviews, ranked #1 specialty lodging in Kissimmee. Primary proof; where only one platform shows, Tripadvisor leads.
- Google: 4.6 out of 5, 1,217 reviews.

Individual guest reviews: 14 real testimonials from the current website's Testimonials page are in `docs/testimonials.md`; nine of them fill the homepage review cards. The social-proof document itself contains no review text. Tripadvisor and Google review text is still to be supplied.

Provisional stand-in cards in the wireframe (NOT real reviews; do not publish):

1. "We came for one night to see if we could do it. We stayed four." — Dana R., First visit, Tripadvisor
2. "Three restaurants, a bar, live music on a Saturday night. Nobody at work believes me when I describe this place." — Tom H., Returning guest, Google
3. "First time at a naturist resort, with a hundred questions. The staff answered every one without a hint of impatience." — Priya S., Day visit, Google
4. "Our kids ask when we are going back. Nobody wanted to leave, including us." — Mark & Lisa, Family visit, Tripadvisor
5. "Spotless, quiet, and the grounds are immaculate. We walk the lake path every morning before breakfast." — Bill & Anne, Members, 20 years
6. "Busy over the holidays, and you book early or you miss out. Otherwise we cannot fault it." — Margaret B., Snowbird, nine winters
7. "Booked the RV site for a week and added two nights on the last morning." — Rick D., RV guest, Tripadvisor
8. "Thirty minutes from Disney, and it feels like another state. We take the same week every winter." — Carlos M., Snowbird, Google
9. "I was worried about being judged. That lasted about ten minutes." — Jenna W., First visit, Google
