// Hand-finished from relume/source/layout487.tsx (Relume Layout 487). Listed
// under "Hand-finished blocks" in docs/agents/relume-import.md; do not
// regenerate.
import { defineArrayMember, defineField, defineType } from "sanity";
import blockTheme from "../shared/block-theme";
import { requiredText } from "../../validation/required-text";

export default defineType({
  name: "relumeLayout487",
  title: "Layout 487",
  type: "object",
  description:
    "Relume feature section: text align left, 3 columns, image/video center, buttons, multiple images, image. On a desktop one photo stays pinned in the middle while the features scroll past on either side, taking turns left and right; each fades in as it reaches the middle of the screen and the photo changes to its own.",
  initialValue: {
    tagline: "Tagline",
    heading: "Short heading goes here",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    features: [1, 2, 3, 4].map((number) => ({
      _key: `feature-${number}`,
      _type: "feature",
      tagline: "Tagline",
      heading: "Medium length section heading goes here",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique.",
    })),
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
        "The features in the order they scroll past: the first on the left, the second on the right, and so on.",
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
              description:
                "Shown in the pinned frame in the middle while this feature is in view (tall, 2:3), and above the feature on a phone.",
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
        rule.required().min(1).error("Add at least one feature."),
    }),
  ],
  preview: {
    select: { title: "heading" },
    prepare: ({ title }) => ({
      title: title || "Untitled Layout 487",
      subtitle: "Layout 487",
    }),
  },
});
