import { CalendarDays, ListOrdered } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import meta from "../blocks/shared/meta";
import { photoField } from "../objects/shared-fields";
import { requiredText } from "../validation/required-text";
import { notBeforeStartDate, slugIsUnique, uniqueSlug } from "../validation/unique-value";

export const EVENT_KINDS = [
  { title: "Themed weekend", value: "themedWeekend" },
  { title: "Live music", value: "liveMusic" },
  { title: "Other", value: "other" },
];

const itineraryLine = defineType({
  name: "itineraryLine",
  title: "Itinerary line",
  type: "object",
  fields: [
    defineField({
      name: "time",
      title: "Time",
      type: "string",
      description: "When it starts, as it should read.",
      placeholder: "e.g. 7 PM",
    }),
    defineField({
      name: "activity",
      title: "Activity",
      type: "string",
      description: "What happens.",
      placeholder: "e.g. Poolside social",
      validation: (rule) => requiredText(rule),
    }),
    defineField({
      name: "place",
      title: "Place",
      type: "string",
      description: "Where on the resort it happens.",
      placeholder: "e.g. Main pool",
    }),
  ],
  preview: {
    select: { activity: "activity", place: "place", time: "time" },
    prepare: ({ activity, place, time }) => ({
      title: [time, activity].filter(Boolean).join(" · "),
      subtitle: place,
    }),
  },
});

const itineraryDay = defineType({
  name: "itineraryDay",
  title: "Itinerary day",
  type: "object",
  icon: ListOrdered,
  fields: [
    defineField({
      name: "label",
      title: "Day",
      type: "string",
      description: "The heading for this day.",
      placeholder: "e.g. Friday",
      validation: (rule) => requiredText(rule),
    }),
    defineField({
      name: "lines",
      title: "Schedule",
      type: "array",
      description: "The day's activities, in the order they happen.",
      of: [defineArrayMember({ type: "itineraryLine" })],
      validation: (rule) =>
        rule.required().min(1).error("Add at least one activity for the day."),
    }),
  ],
  preview: {
    select: { lines: "lines", title: "label" },
    prepare: ({ lines, title }) => ({
      title,
      subtitle: `${lines?.length ?? 0} activities`,
    }),
  },
});

const event = defineType({
  name: "event",
  title: "Event",
  type: "document",
  icon: CalendarDays,
  description:
    "One dated event. It feeds the home page, Today at the Cove, the Events page, the calendar and the event's own page.",
  groups: [
    { name: "basics", title: "Basics", default: true },
    { name: "details", title: "Details" },
    { name: "seo", title: "SEO" },
  ],
  initialValue: { kind: "themedWeekend", bigAnnualEvent: false },
  fields: [
    defineField({
      name: "kind",
      title: "Kind",
      type: "string",
      group: "basics",
      description:
        "Decides where the event is listed. A themed weekend gets the full event page; live music shows with the venue's listings.",
      options: { list: EVENT_KINDS, layout: "radio" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      group: "basics",
      description: "The event's name as guests know it.",
      validation: (rule) => requiredText(rule),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "basics",
      description: "The last part of the event page's address.",
      options: { source: "name", maxLength: 96, isUnique: slugIsUnique },
      validation: (rule) => rule.required().custom(uniqueSlug("event")),
    }),
    defineField({
      name: "startDate",
      title: "Start date",
      type: "date",
      group: "basics",
      description: "The first day of the event.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "endDate",
      title: "End date",
      type: "date",
      group: "basics",
      description: "The last day. Leave empty for a single-day event.",
      validation: (rule) => rule.custom(notBeforeStartDate),
    }),
    defineField({
      name: "time",
      title: "Time",
      type: "string",
      group: "basics",
      description: "Optional. For a single-day event with a start time.",
      placeholder: "e.g. 7 PM to 10 PM",
    }),
    defineField({
      name: "summary",
      title: "One-line summary",
      type: "text",
      rows: 2,
      group: "basics",
      description:
        "One sentence that says what the event is. Shown on cards and under the name.",
      validation: (rule) => requiredText(rule),
    }),
    photoField({
      name: "image",
      title: "Photo",
      group: "basics",
      description: "Shown on the event's cards and at the top of its page.",
    }),
    defineField({
      name: "bigAnnualEvent",
      title: "Big annual event",
      type: "boolean",
      group: "basics",
      description: "Also lists the event on the Big annual events page.",
    }),
    defineField({
      name: "inShort",
      title: "In short",
      type: "object",
      group: "details",
      description: "Three short answers a visitor needs to decide.",
      fields: [
        defineField({
          name: "whoFor",
          title: "Who it is for",
          type: "text",
          rows: 2,
          description: "The guests this event suits.",
        }),
        defineField({
          name: "included",
          title: "What is included",
          type: "text",
          rows: 2,
          description: "What a guest gets without paying extra.",
        }),
        defineField({
          name: "whatToBook",
          title: "What to book",
          type: "text",
          rows: 2,
          description: "What a guest needs to reserve to take part.",
        }),
      ],
    }),
    defineField({
      name: "itinerary",
      title: "Itinerary",
      type: "array",
      group: "details",
      description: "The schedule, one entry per day.",
      of: [defineArrayMember({ type: "itineraryDay" })],
    }),
    defineField({
      name: "pricing",
      title: "Prices and what is included",
      type: "simpleRichText",
      group: "details",
      description:
        "What comes with a stay, the day visit fee, and any ticketed extras.",
    }),
    defineField({
      name: "whatToBring",
      title: "What to bring and the rules",
      type: "simpleRichText",
      group: "details",
      description:
        "What to pack and the rules that are different for this event.",
    }),
    defineField({
      name: "places",
      title: "Places on the resort",
      type: "array",
      group: "details",
      description: "The map locations where the event happens.",
      of: [defineArrayMember({ type: "reference", to: [{ type: "mapLocation" }] })],
      validation: (rule) => rule.unique(),
    }),
    meta,
  ],
  orderings: [
    {
      title: "Start date, newest first",
      name: "startDateDesc",
      by: [{ field: "startDate", direction: "desc" }],
    },
    {
      title: "Start date, oldest first",
      name: "startDateAsc",
      by: [{ field: "startDate", direction: "asc" }],
    },
  ],
  preview: {
    select: { kind: "kind", media: "image", startDate: "startDate", title: "name" },
    prepare: ({ kind, media, startDate, title }) => ({
      title: title || "Untitled event",
      subtitle: [
        startDate,
        EVENT_KINDS.find((entry) => entry.value === kind)?.title,
      ]
        .filter(Boolean)
        .join(" · "),
      media,
    }),
  },
});

export const eventSchemaTypes = [itineraryLine, itineraryDay];

export default event;
