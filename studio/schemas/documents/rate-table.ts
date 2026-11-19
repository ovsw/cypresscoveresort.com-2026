import { Table } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import { requiredText } from "../validation/required-text";

export default defineType({
  name: "rateTable",
  title: "Rate table",
  type: "document",
  icon: Table,
  description:
    "A reusable list of prices, such as day visit fees or membership dues. Every page that shows it reads this one record.",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "What the prices are for.",
      placeholder: "e.g. Day visit fees",
      validation: (rule) => requiredText(rule),
    }),
    defineField({
      name: "rows",
      title: "Rates",
      type: "array",
      description: "One row per price, in the order shown.",
      of: [defineArrayMember({ type: "rateRow" })],
      validation: (rule) =>
        rule.required().min(1).error("Add at least one rate."),
    }),
    defineField({
      name: "footnote",
      title: "Footnote",
      type: "text",
      rows: 2,
      description: "Optional. Taxes, conditions or the date the rates are valid until.",
    }),
  ],
  preview: {
    select: { rows: "rows", title: "title" },
    prepare: ({ rows, title }) => ({
      title: title || "Untitled rate table",
      subtitle: `${rows?.length ?? 0} rates`,
    }),
  },
});
