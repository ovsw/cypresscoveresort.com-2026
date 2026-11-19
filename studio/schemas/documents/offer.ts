import { BadgePercent } from "lucide-react";
import { defineField, defineType } from "sanity";
import { requiredText } from "../validation/required-text";
import { notBeforeStartDate } from "../validation/unique-value";

export default defineType({
  name: "offer",
  title: "Offer",
  type: "document",
  icon: BadgePercent,
  description:
    "A special offer. Offer strips and the Special Offers page show the same record.",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "The offer in a few words.",
      placeholder: "e.g. Free tour, then a half-price day",
      validation: (rule) => requiredText(rule),
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 2,
      description: "One or two sentences that say what the guest gets.",
      validation: (rule) => requiredText(rule),
    }),
    defineField({
      name: "terms",
      title: "Terms",
      type: "text",
      rows: 3,
      description: "Optional. The conditions, shown in small print.",
    }),
    defineField({
      name: "startDate",
      title: "Start date",
      type: "date",
      description: "Optional. The first day the offer is valid.",
    }),
    defineField({
      name: "endDate",
      title: "End date",
      type: "date",
      description: "Optional. The last day the offer is valid.",
      validation: (rule) => rule.custom(notBeforeStartDate),
    }),
    defineField({
      name: "couponCode",
      title: "Coupon code",
      type: "string",
      description: "Optional. The code a guest gives to claim the offer.",
      placeholder: "e.g. FIRSTVISIT",
    }),
    defineField({
      name: "button",
      title: "Button",
      type: "button",
      description: "Optional. Where the offer leads.",
    }),
  ],
  preview: {
    select: { endDate: "endDate", title: "title" },
    prepare: ({ endDate, title }) => ({
      title: title || "Untitled offer",
      subtitle: endDate ? `Until ${endDate}` : "No end date",
    }),
  },
});
