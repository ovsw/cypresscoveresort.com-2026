// Hand-finished from relume/source/event9.tsx (Relume Event 9). Listed under
// "Hand-finished blocks" in docs/agents/relume-import.md, so
// `pnpm relume:convert` never regenerates it.
import { defineArrayMember, defineField, defineType } from "sanity";
import blockTheme from "../shared/block-theme";
import { requiredText } from "../../validation/required-text";

export default defineType({
  name: "relumeEvent9",
  title: "Event 9",
  type: "object",
  description:
    "Relume event section: 3 columns, text align left, buttons, date, tags, multiple images.",
  initialValue: {
    tagline: "Tagline",
    heading: "Events",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  },
  fields: [
    blockTheme,
    defineField({
      name: "tagline",
      type: "string",
    }),
    defineField({
      name: "heading",
      type: "string",
      validation: (rule) =>
        requiredText(
          rule,
          "Add the heading. The block is not shown without it.",
        ),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "buttons",
      type: "array",
      description:
        "A link to every event, such as View all. Shown beside the heading, and under the events on a phone.",
      of: [defineArrayMember({ type: "button" })],
      validation: (rule) => rule.max(1),
    }),
    defineField({
      name: "events",
      type: "array",
      of: [
        defineArrayMember({
          name: "event",
          type: "object",
          fields: [
            defineField({
              name: "image",
              type: "image",
              options: { hotspot: true },
              fields: [
                defineField({
                  name: "alt",
                  type: "string",
                  title: "Alt Text",
                  description:
                    "Describe the image for screen readers. Leave empty if the image is decorative or repeats nearby text.",
                }),
              ],
              validation: (rule) =>
                rule
                  .required()
                  .assetRequired()
                  .error("Add the image. The event needs it."),
            }),
            defineField({
              name: "date",
              type: "date",
              description:
                "The day of the event, shown on the photo as its weekday, day, month and year.",
              validation: (rule) =>
                rule
                  .required()
                  .error("Add the date. The event is not shown without it."),
            }),
            defineField({
              name: "category",
              type: "string",
              description: "A short tag over the title, such as Workshop.",
            }),
            defineField({
              name: "title",
              type: "string",
              validation: (rule) =>
                requiredText(
                  rule,
                  "Add the title. The event is not shown without it.",
                ),
            }),
            defineField({
              name: "location",
              type: "string",
              description: "Where it takes place, such as a venue and city.",
            }),
            defineField({
              name: "description",
              type: "text",
              rows: 3,
            }),
            defineField({
              name: "link",
              type: "button",
              description:
                "The event's page, and the label of the link under the description, such as View event. The photo and the title link there too.",
              validation: (rule) =>
                rule
                  .required()
                  .error("Add the link. The event is not shown without it."),
            }),
          ],
          preview: {
            select: { title: "title", subtitle: "date", media: "image" },
          },
        }),
      ],
      validation: (rule) =>
        rule.required().min(1).error("Add at least one event."),
    }),
  ],
  preview: {
    select: { title: "heading" },
    prepare: ({ title }) => ({
      title: title || "Untitled Event 9",
      subtitle: "Event 9",
    }),
  },
});
