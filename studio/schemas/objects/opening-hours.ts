import { Clock } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import { requiredText } from "../validation/required-text";

/**
 * Opening hours as people write them: a days label and an hours text per row.
 * Used wherever hours appear (venues, the pool), so they read the same
 * everywhere.
 */
export const openingHoursRow = defineType({
  name: "openingHoursRow",
  title: "Hours row",
  type: "object",
  icon: Clock,
  fields: [
    defineField({
      name: "days",
      title: "Days",
      type: "string",
      description: "The day or days this row covers.",
      placeholder: "e.g. Mon to Thu",
      validation: (rule) => requiredText(rule),
    }),
    defineField({
      name: "hours",
      title: "Hours",
      type: "string",
      description: "Opening and closing time, or Closed.",
      placeholder: "e.g. 11 AM to 9 PM",
      validation: (rule) => requiredText(rule),
    }),
  ],
  preview: { select: { title: "days", subtitle: "hours" } },
});

export const openingHours = defineType({
  name: "openingHours",
  title: "Opening hours",
  type: "object",
  icon: Clock,
  fields: [
    defineField({
      name: "rows",
      title: "Hours",
      type: "array",
      description: "One row per day or group of days, in the order shown.",
      of: [defineArrayMember({ type: "openingHoursRow" })],
    }),
    defineField({
      name: "note",
      title: "Note",
      type: "string",
      description: "Optional. Anything that qualifies the hours.",
      placeholder: "e.g. Kitchen closes 30 minutes earlier",
    }),
  ],
});
