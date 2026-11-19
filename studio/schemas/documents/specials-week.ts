import { Soup } from "lucide-react";
import { defineField, defineType, type ValidationContext } from "sanity";
import { uniqueValue } from "../validation/unique-value";
import { WEEKDAYS } from "./weekly-schedule";

const uniqueWeek = uniqueValue("weekOf", "specials week");

/** The week-of date is the Monday, so every week has exactly one record. */
async function mondayOnce(value: string | undefined, context: ValidationContext) {
  if (!value) return true;
  if (new Date(`${value}T00:00:00Z`).getUTCDay() !== 1) {
    return "Pick the Monday that starts the week";
  }
  return uniqueWeek(value, context);
}

const dailySpecial = defineType({
  name: "dailySpecial",
  title: "Daily special",
  type: "object",
  fields: [
    defineField({
      name: "dish",
      title: "Dish",
      type: "string",
      description: "The special of the day. Leave empty if there is none.",
      placeholder: "e.g. Fish and chips",
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "string",
      description: "The price as it should read, with the currency sign.",
      placeholder: "e.g. $00",
    }),
    defineField({
      name: "note",
      title: "Note",
      type: "string",
      description: "Optional. Serving times or what comes with it.",
      placeholder: "e.g. From 5 PM, with two sides",
    }),
  ],
});

const specialsWeek = defineType({
  name: "specialsWeek",
  title: "Specials week",
  type: "document",
  icon: Soup,
  description:
    "The specials at Cheeks for one week. Add next week's record before it starts.",
  fields: [
    defineField({
      name: "weekOf",
      title: "Week of",
      type: "date",
      description: "The Monday that starts the week.",
      validation: (rule) => rule.required().custom(mondayOnce),
    }),
    ...WEEKDAYS.map((day) =>
      defineField({
        name: day.name,
        title: day.title,
        type: "dailySpecial",
        description: `The special on ${day.title}.`,
      }),
    ),
    defineField({
      name: "happyHour",
      title: "Happy hour",
      type: "text",
      rows: 2,
      description: "Optional. The happy hour times and offer for this week.",
    }),
  ],
  orderings: [
    {
      title: "Week, newest first",
      name: "weekOfDesc",
      by: [{ field: "weekOf", direction: "desc" }],
    },
  ],
  preview: {
    select: { weekOf: "weekOf" },
    prepare: ({ weekOf }) => ({
      title: weekOf ? `Week of ${weekOf}` : "Week not set",
    }),
  },
});

export const specialsWeekSchemaTypes = [dailySpecial];

export default specialsWeek;
