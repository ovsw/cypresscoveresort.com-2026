// Hand-finished from relume/source/header103.tsx (Relume Header 103): a
// full-screen hero whose tabs each hold their own photo, heading and
// buttons; each tab's bar fills, then the next tab opens. The converter
// cannot model a hero without a heading of its own or its auto-advancing
// tabs. Listed under "Hand-finished blocks" in docs/agents/relume-import.md;
// do not regenerate.
import { defineArrayMember, defineField, defineType } from "sanity";
import blockTheme from "../shared/block-theme";
import { requiredText } from "../../validation/required-text";

export default defineType({
  name: "relumeHeader103",
  title: "Header 103",
  type: "object",
  description:
    "Relume hero header section: 1 column, text align center, buttons, background image, tabs. Each tab has its own photo, heading and buttons; the tabs move on by themselves.",
  fields: [
    blockTheme,
    defineField({
      name: "tabs",
      type: "array",
      description:
        "Two to four tabs, each with its own photo, heading and buttons. The labels line up at the bottom of the hero, and the tabs follow one another by themselves, in this order.",
      of: [
        defineArrayMember({
          name: "tab",
          type: "object",
          fields: [
            defineField({
              name: "label",
              type: "string",
              description:
                "The tab's name in the row at the bottom of the hero.",
              validation: (rule) =>
                requiredText(
                  rule,
                  "Add the label. The tab is not shown without it.",
                ),
            }),
            defineField({
              name: "heading",
              type: "string",
              validation: (rule) =>
                requiredText(
                  rule,
                  "Add the heading. The tab is not shown without it.",
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
              of: [defineArrayMember({ type: "button" })],
              validation: (rule) => rule.max(2),
            }),
            defineField({
              name: "image",
              type: "image",
              description:
                "The photo behind the tab's text. It is darkened so the text stays readable.",
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
                  .error("Add the image. The tab needs it."),
            }),
          ],
          preview: {
            select: { title: "label", subtitle: "heading", media: "image" },
          },
        }),
      ],
      validation: (rule) =>
        rule.required().min(2).max(4).error("Add two to four tabs."),
    }),
  ],
  preview: {
    select: { title: "tabs.0.heading", media: "tabs.0.image" },
    prepare: ({ title, media }) => ({
      title: title || "Untitled Header 103",
      subtitle: "Header 103",
      media,
    }),
  },
});
