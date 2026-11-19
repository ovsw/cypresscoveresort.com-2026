// Runs Studio's own validation on the resort's document types, with the
// Studio's real schema types: what an editor may publish and what Studio
// refuses. Every value here is made up; no real price or contact is used.
import assert from "node:assert/strict";
import test from "node:test";
import {
  createSchema,
  createValidator,
  schemaTypes,
} from "./studio-validation.mjs";
import { singletonDocumentTypes } from "../../singletons.ts";

const schema = createSchema({ name: "content-model-test", types: schemaTypes });
const { errors, errorPaths } = createValidator(schema);
// A dataset where every uniqueness query finds another document.
const taken = createValidator(schema, async () => ({ _id: "other" }));

const image = { _type: "image", asset: { _ref: "image-abc-1x1-jpg", _type: "reference" } };
const photos = [{ ...image, _key: "photo" }];
const slug = (current) => ({ _type: "slug", current });
const ref = (_ref) => ({ _ref, _type: "reference" });
const rateRow = { _key: "row", _type: "rateRow", label: "Adult", price: "$1" };

const event = {
  _type: "event",
  kind: "themedWeekend",
  name: "Example Weekend",
  slug: slug("example-weekend"),
  startDate: "2030-03-08",
  summary: "A weekend used by the tests.",
};

test("an event needs its name, kind, slug, start date and summary", async () => {
  assert.deepEqual(await errors(event), {});
  assert.deepEqual(await errorPaths({ _type: "event" }), [
    "kind",
    "name",
    "slug",
    "slug.current",
    "startDate",
    "summary",
  ]);
});

test("an event cannot end before it starts", async () => {
  assert.deepEqual(await errors({ ...event, endDate: "2030-03-10" }), {});
  assert.deepEqual(await errors({ ...event, endDate: "2030-03-08" }), {});
  assert.match(
    (await errors({ ...event, endDate: "2030-03-07" })).endDate,
    /before the start date/,
  );
});

test("dates must exist on the calendar", async () => {
  assert.deepEqual(await errorPaths({ ...event, startDate: "2030-02-30" }), [
    "startDate",
  ]);
  assert.deepEqual(
    await errorPaths({ ...event, startDate: "2030-02-28", endDate: "2030-02-30" }),
    ["endDate"],
  );
  assert.match(
    (await errors({ _type: "specialsWeek", weekOf: "2030-02-30" })).weekOf,
    /exists on the calendar/,
  );
});

test("a photo entry without an uploaded file does not count as a photo", async () => {
  const empty = { _type: "image", alt: "A room" };
  assert.deepEqual(await errorPaths({ _type: "resortMap", image: empty }), [
    "image",
  ]);
  assert.deepEqual(
    await errorPaths({
      _type: "accommodation",
      kind: "villa",
      name: "Example Room",
      photos: [{ ...empty, _key: "photo" }],
    }),
    ["photos.[photo]"],
  );
});

test("a single-day event needs no end date and may carry a time", async () => {
  assert.deepEqual(
    await errors({ ...event, kind: "liveMusic", time: "7 PM" }),
    {},
  );
});

test("an itinerary day needs a label and at least one activity", async () => {
  const day = (fields) => ({
    ...event,
    itinerary: [{ _key: "day", _type: "itineraryDay", ...fields }],
  });
  assert.deepEqual(
    await errors(
      day({
        label: "Friday",
        lines: [{ _key: "line", _type: "itineraryLine", activity: "Social" }],
      }),
    ),
    {},
  );
  assert.deepEqual(await errorPaths(day({})), [
    "itinerary.[day].label",
    "itinerary.[day].lines",
  ]);
});

test("slugs are one lowercase segment and unique within their type", async () => {
  assert.match(
    (await errors({ ...event, slug: slug("Example Weekend") })).slug,
    /lowercase letters/,
  );
  assert.match((await taken.errors(event)).slug, /Another event already uses/);
});

const specialsWeek = { _type: "specialsWeek", weekOf: "2030-03-04" };

test("a specials week starts on a Monday and exists once", async () => {
  assert.deepEqual(await errors(specialsWeek), {});
  assert.deepEqual(await errorPaths({ _type: "specialsWeek" }), ["weekOf"]);
  assert.match(
    (await errors({ ...specialsWeek, weekOf: "2030-03-05" })).weekOf,
    /Monday/,
  );
  assert.match(
    (await taken.errors(specialsWeek)).weekOf,
    /Another specials week already uses 2030-03-04/,
  );
});

test("a specials week holds one special for each of the seven days", () => {
  const days = schema
    .get("specialsWeek")
    .fields.filter((field) => field.type.name === "dailySpecial")
    .map((field) => field.name);
  assert.deepEqual(days, [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ]);
});

test("a venue needs a name; a menu needs a title, a section and an item", async () => {
  assert.deepEqual(await errors({ _type: "venue", name: "Example Grill" }), {});
  assert.deepEqual(await errorPaths({ _type: "venue", name: " " }), ["name"]);
  assert.deepEqual(
    await errorPaths({
      _type: "venue",
      name: "Example Grill",
      menus: [{ _key: "menu", _type: "venueMenu" }],
    }),
    ["menus.[menu].sections", "menus.[menu].title"],
  );
});

test("an hours row needs its days and its hours", async () => {
  const withRow = (row) => ({
    _type: "todayStatus",
    poolHours: {
      _type: "openingHours",
      rows: [{ _key: "row", _type: "openingHoursRow", ...row }],
    },
  });
  assert.deepEqual(await errors({ _type: "todayStatus" }), {});
  assert.deepEqual(
    await errors(withRow({ days: "Every day", hours: "8 AM to 10 PM" })),
    {},
  );
  assert.deepEqual(await errorPaths(withRow({})), [
    "poolHours.rows.[row].days",
    "poolHours.rows.[row].hours",
  ]);
});

test("an accommodation needs a name, a kind and a photo", async () => {
  assert.deepEqual(
    await errors({
      _type: "accommodation",
      kind: "villa",
      name: "Example Room",
      photos,
      rates: [rateRow],
    }),
    {},
  );
  assert.deepEqual(await errorPaths({ _type: "accommodation" }), [
    "kind",
    "name",
    "photos",
  ]);
});

test("a rate table needs a title and a rate; a rate needs a label and a price", async () => {
  const table = { _type: "rateTable", title: "Example fees" };
  assert.deepEqual(await errors({ ...table, rows: [rateRow] }), {});
  assert.deepEqual(await errorPaths({ _type: "rateTable" }), ["rows", "title"]);
  assert.deepEqual(
    await errorPaths({ ...table, rows: [{ _key: "row", _type: "rateRow" }] }),
    ["rows.[row].label", "rows.[row].price"],
  );
});

test("an offer needs a title and a summary, and cannot end before it starts", async () => {
  const offer = { _type: "offer", title: "Example offer", summary: "A test." };
  assert.deepEqual(await errors(offer), {});
  assert.deepEqual(await errorPaths({ _type: "offer" }), ["summary", "title"]);
  assert.match(
    (await errors({ ...offer, startDate: "2030-05-02", endDate: "2030-05-01" }))
      .endDate,
    /before the start date/,
  );
});

test("a map location needs a name and a pin inside the photo", async () => {
  const location = (position) => ({
    _type: "mapLocation",
    name: "Example Dock",
    position,
  });
  assert.deepEqual(await errors(location({ x: 0, y: 100 })), {});
  // A missing position also reports the two numbers inside it.
  assert.deepEqual(await errorPaths({ _type: "mapLocation" }), [
    "name",
    "position",
    "position.x",
    "position.y",
  ]);
  assert.deepEqual(await errorPaths(location({ x: 50 })), ["position.y"]);
  assert.deepEqual(await errorPaths(location({ x: -1, y: 100.5 })), [
    "position.x",
    "position.y",
  ]);
});

test("the resort map needs its aerial photo", async () => {
  assert.deepEqual(await errors({ _type: "resortMap", image }), {});
  assert.deepEqual(await errorPaths({ _type: "resortMap" }), ["image"]);
});

test("a property listing needs a title, a slug, a type and a status", async () => {
  assert.deepEqual(
    await errors({
      _type: "propertyListing",
      title: "Example home",
      slug: slug("example-home"),
      listingType: "rent",
      status: "pending",
    }),
    {},
  );
  assert.deepEqual(await errorPaths({ _type: "propertyListing" }), [
    "listingType",
    "slug",
    "slug.current",
    "status",
    "title",
  ]);
});

test("a newsletter issue needs a title, a date, and a link or a PDF", async () => {
  const issue = { _type: "newsletterIssue", title: "Example issue", date: "2030-03-07" };
  const file = { _type: "file", asset: ref("file-abc-pdf") };
  assert.deepEqual(await errors({ ...issue, url: "https://example.com/issue" }), {});
  assert.deepEqual(await errors({ ...issue, file }), {});
  assert.match((await errors(issue)).url, /link or upload a PDF/);
  assert.deepEqual(await errorPaths({ _type: "newsletterIssue", file }), [
    "date",
    "title",
  ]);
});

const product = {
  _type: "product",
  name: "Example Tee",
  slug: slug("example-tee"),
  category: ref("category-apparel"),
  photos,
  sku: "TEE-EXAMPLE",
  price: 0,
  weight: 0.5,
  shippingCategory: "DEFAULT",
};

test("a product needs what the store and the cart need", async () => {
  assert.deepEqual(await errors(product), {});
  assert.deepEqual(await errorPaths({ _type: "product" }), [
    "category",
    "name",
    "photos",
    "price",
    "shippingCategory",
    "sku",
    "slug",
    "slug.current",
    "weight",
  ]);
});

test("a product's price is not negative and its weight is more than zero", async () => {
  assert.deepEqual(await errorPaths({ ...product, price: -1, weight: 0 }), [
    "price",
    "weight",
  ]);
});

test("a product's shipping category is one the cart knows", async () => {
  assert.deepEqual(
    await errorPaths({ ...product, shippingCategory: "made-up" }),
    ["shippingCategory"],
  );
});

test("two products cannot share a SKU", async () => {
  assert.match(
    (await taken.errors(product)).sku,
    /Another product already uses TEE-EXAMPLE/,
  );
});

test("a product option needs a name and values with different labels", async () => {
  const value = (_key, label, fields) => ({
    _key,
    _type: "productOptionValue",
    label,
    ...fields,
  });
  const withOption = (option) => ({
    ...product,
    options: [{ _key: "size", _type: "productOptionGroup", ...option }],
  });
  assert.deepEqual(
    await errors(
      withOption({
        name: "Size",
        values: [
          value("m", "M"),
          value("xl", "XL", {
            priceAdjustment: 2,
            skuSuffix: "-XL",
            soldOut: true,
            weightAdjustment: 0.1,
          }),
        ],
      }),
    ),
    {},
  );
  assert.deepEqual(await errorPaths(withOption({})), [
    "options.[size].name",
    "options.[size].values",
  ]);
  assert.match(
    (
      await errors(
        withOption({ name: "Size", values: [value("a", "M"), value("b", "m ")] }),
      )
    )["options.[size].values"],
    /same label/,
  );
});

test("a whole product can be marked sold out", async () => {
  assert.deepEqual(await errors({ ...product, soldOut: true }), {});
});

test("a product category needs a title and a slug", async () => {
  assert.deepEqual(
    await errors({
      _type: "productCategory",
      title: "Apparel",
      slug: slug("apparel"),
    }),
    {},
  );
  assert.deepEqual(await errorPaths({ _type: "productCategory" }), [
    "slug",
    "slug.current",
    "title",
  ]);
});

test("the store page needs a title", async () => {
  assert.deepEqual(await errors({ _type: "storeIndex", title: "Shop" }), {});
  assert.deepEqual(await errorPaths({ _type: "storeIndex" }), ["title"]);
});

test("the banner needs text only while it is switched on", async () => {
  const settings = (banner) => ({ _type: "settings", siteName: "Example", banner });
  assert.deepEqual(await errors(settings({ enabled: false })), {});
  assert.deepEqual(
    await errors(settings({ enabled: true, text: "Pool closed Tuesday" })),
    {},
  );
  assert.deepEqual(await errorPaths(settings({ enabled: true, text: " " })), [
    "banner.text",
  ]);
});

test("Site settings take web links and a rating out of 5", async () => {
  const settings = { _type: "settings", siteName: "Example" };
  assert.deepEqual(
    await errors({
      ...settings,
      bookingUrl: "https://example.com/book",
      dayPassUrl: "https://example.com/day-pass",
      loginUrl: "https://example.com/login",
      reviewRating: { rating: 4.5, source: "Example Reviews" },
    }),
    {},
  );
  assert.deepEqual(
    await errorPaths({
      ...settings,
      bookingUrl: "ftp://example.com",
      reviewRating: { rating: 6 },
    }),
    ["bookingUrl", "reviewRating.rating"],
  );
});

test("a testimonial can name its source", async () => {
  const block = {
    _key: "block",
    _type: "block",
    children: [{ _key: "span", _type: "span", marks: [], text: "Great." }],
    markDefs: [],
    style: "normal",
  };
  assert.deepEqual(
    await errors({
      _type: "testimonial",
      name: "Example Guest",
      source: "Example Reviews",
      body: [block],
    }),
    {},
  );
});

test("the one-of-a-kind records are singletons and the collections are not", () => {
  for (const type of ["weeklySchedule", "todayStatus", "resortMap", "storeIndex"]) {
    assert.ok(singletonDocumentTypes.has(type), type);
    assert.equal(schema.get(type)?.type?.name, "document", type);
  }
  for (const type of [
    "event",
    "specialsWeek",
    "venue",
    "accommodation",
    "rateTable",
    "offer",
    "mapLocation",
    "propertyListing",
    "newsletterIssue",
    "product",
    "productCategory",
  ]) {
    assert.equal(singletonDocumentTypes.has(type), false, type);
    assert.equal(schema.get(type)?.type?.name, "document", type);
  }
});

test("the unused Starter types are gone", () => {
  assert.equal(schema.get("author"), undefined);
  assert.equal(schema.get("teamMember"), undefined);
});
