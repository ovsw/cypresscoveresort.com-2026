import { Sun } from "lucide-react";
import { defineField, defineType } from "sanity";

export default defineType({
  name: "todayStatus",
  title: "Today's conditions",
  type: "document",
  icon: Sun,
  description:
    "The pool, hot tub and lake conditions shown on Today at the Cove. The page shows when this was last saved, so save it each time you check.",
  fields: [
    defineField({
      name: "pool",
      title: "Pool",
      type: "string",
      description: "The pool's condition right now.",
      placeholder: "e.g. Open, 84°F",
    }),
    defineField({
      name: "hotTub",
      title: "Hot tub",
      type: "string",
      description: "The hot tub's condition right now.",
      placeholder: "e.g. Open, 102°F",
    }),
    defineField({
      name: "lake",
      title: "Lake",
      type: "string",
      description: "The lake's condition right now.",
      placeholder: "e.g. Calm, swimming allowed",
    }),
    defineField({
      name: "poolHours",
      title: "Pool hours",
      type: "openingHours",
      description: "When the pools are open.",
    }),
    defineField({
      name: "note",
      title: "Note",
      type: "text",
      rows: 2,
      description: "Optional. Anything else guests should know today.",
    }),
  ],
  preview: { prepare: () => ({ title: "Today's conditions" }) },
});
