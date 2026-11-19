import { Receipt } from "lucide-react";
import { defineField, defineType } from "sanity";
import { requiredText } from "../validation/required-text";

/**
 * One line of a rate table or of an accommodation's seasonal rates. The
 * price is text, so "Free" and "from" wording are possible.
 */
export default defineType({
  name: "rateRow",
  title: "Rate",
  type: "object",
  icon: Receipt,
  fields: [
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      description: "What the price is for: a guest type, a season, a site type.",
      placeholder: "e.g. Adult day visit",
      validation: (rule) => requiredText(rule),
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "string",
      description: "The price as it should read, with the currency sign.",
      placeholder: "e.g. $00 per night",
      validation: (rule) => requiredText(rule),
    }),
    defineField({
      name: "note",
      title: "Note",
      type: "string",
      description: "Optional. A condition or detail shown with the price.",
      placeholder: "e.g. Weekends only",
    }),
  ],
  preview: { select: { title: "label", subtitle: "price" } },
});
