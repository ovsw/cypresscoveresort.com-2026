// Hand-finished from relume/source/layout348.tsx (Relume Layout 348): a list
// of features that scroll past a pinned photo, which changes to each
// feature's own photo as it reaches the middle of the screen. The converter
// cannot model a block without a heading of its own or its scroll-watching
// code. Relume keeps the pinned photos in a second list that repeats the
// features' photos; here each feature holds its one photo. Listed under
// "Hand-finished blocks" in docs/agents/relume-import.md; do not regenerate.
import { defineArrayMember, defineField, defineType } from "sanity";
import blockTheme from "../shared/block-theme";
import { requiredText } from "../../validation/required-text";

export default defineType({
  name: "relumeLayout348",
  title: "Layout 348",
  type: "object",
  description:
    "Relume feature section: text align left, 2 columns, image/video left, buttons, multiple images. Features scroll past a pinned photo that changes with each one.",
  fields: [
    blockTheme,
    defineField({
      name: "features",
      type: "array",
      description:
        "At least two. Each feature fills a screen on a desktop, beside its photo, which stays in place while the visitor scrolls on.",
      of: [
        defineArrayMember({
          name: "feature",
          type: "object",
          fields: [
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
                  "Add the heading. The feature is not shown without it.",
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
                  .error("Add the image. The feature needs it."),
            }),
          ],
          preview: {
            select: { title: "heading", subtitle: "tagline", media: "image" },
          },
        }),
      ],
      validation: (rule) =>
        rule.required().min(2).error("Add at least two features."),
    }),
  ],
  preview: {
    select: { title: "features.0.heading", media: "features.0.image" },
    prepare: ({ title, media }) => ({
      title: title || "Untitled Layout 348",
      subtitle: "Layout 348",
      media,
    }),
  },
});
