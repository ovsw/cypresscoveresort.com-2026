// Hand-finished from relume/source/layout422.tsx (Relume Layout 422). Listed
// under "Hand-finished blocks" in docs/agents/relume-import.md, so
// `pnpm relume:convert` never regenerates it.
import { defineArrayMember, defineField, defineType } from "sanity";
import blockTheme from "../shared/block-theme";
import { requiredText } from "../../validation/required-text";

export default defineType({
  name: "relumeLayout422",
  title: "Layout 422",
  type: "object",
  description:
    "Relume feature section: 2 columns, text align center, text align left, multiple images, background image, image.",
  initialValue: {
    tagline: "Tagline",
    heading: "Heading goes here",
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
      name: "features",
      type: "array",
      description:
        "The two panels, side by side. On a desktop a panel widens and shows its description and link while the pointer is over it.",
      of: [
        defineArrayMember({
          name: "feature",
          type: "object",
          fields: [
            defineField({
              name: "image",
              type: "image",
              description: "The panel's background photo, under its text.",
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
                  .error("Add the image. The panel needs it."),
            }),
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
                  "Add the heading. The panel is not shown without it.",
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
                "Where the panel leads, such as Learn more. The whole panel links there.",
              of: [defineArrayMember({ type: "button" })],
              validation: (rule) => rule.max(1),
            }),
          ],
          preview: {
            select: { title: "heading", subtitle: "tagline", media: "image" },
          },
        }),
      ],
      validation: (rule) =>
        rule
          .required()
          .length(2)
          .error("Add exactly two panels. The layout has two columns."),
    }),
  ],
  preview: {
    select: { title: "heading" },
    prepare: ({ title }) => ({
      title: title || "Untitled Layout 422",
      subtitle: "Layout 422",
    }),
  },
});
