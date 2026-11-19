import { BedDouble } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import { photosField } from "../objects/shared-fields";
import { requiredText } from "../validation/required-text";

export const ACCOMMODATION_KINDS = [
  { title: "Villa room", value: "villa" },
  { title: "Campground site", value: "campground" },
  { title: "RV site", value: "rv" },
];

export default defineType({
  name: "accommodation",
  title: "Accommodation",
  type: "document",
  icon: BedDouble,
  description: "One room type or site type guests can book, with its rates.",
  fields: [
    defineField({
      name: "kind",
      title: "Kind",
      type: "string",
      description: "Decides which Stay page lists it.",
      options: { list: ACCOMMODATION_KINDS, layout: "radio" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      description: "The room or site type as guests book it.",
      placeholder: "e.g. Poolside villa room",
      validation: (rule) => requiredText(rule),
    }),
    photosField({
      name: "photos",
      title: "Photos",
      description: "The first photo is the main one.",
      min: 1,
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
      description: "What staying here is like.",
    }),
    defineField({
      name: "features",
      title: "Features",
      type: "array",
      description: "Short facts shown as a list.",
      of: [defineArrayMember({ type: "string", placeholder: "e.g. King bed" })],
    }),
    defineField({
      name: "fromPrice",
      title: "From-price",
      type: "number",
      description:
        "The lowest nightly rate, as a number without the currency sign. Shown as \"from\" on cards.",
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "rates",
      title: "Seasonal rates",
      type: "array",
      description: "One row per season or period.",
      of: [defineArrayMember({ type: "rateRow" })],
    }),
    defineField({
      name: "sortOrder",
      title: "Sort order",
      type: "number",
      description: "Lower numbers are listed first.",
    }),
  ],
  orderings: [
    {
      title: "Sort order",
      name: "sortOrderAsc",
      by: [
        { field: "sortOrder", direction: "asc" },
        { field: "name", direction: "asc" },
      ],
    },
  ],
  preview: {
    select: { kind: "kind", media: "photos.0", title: "name" },
    prepare: ({ kind, media, title }) => ({
      title: title || "Untitled accommodation",
      subtitle: ACCOMMODATION_KINDS.find((entry) => entry.value === kind)?.title,
      media,
    }),
  },
});
