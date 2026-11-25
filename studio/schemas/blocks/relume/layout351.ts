// Hand-finished from relume/source/layout351.tsx (Relume Layout 351). Listed
// under "Hand-finished blocks" in docs/agents/relume-import.md; do not
// regenerate.
import { defineArrayMember, defineField, defineType } from "sanity";
import blockTheme from "../shared/block-theme";
import { requiredText } from "../../validation/required-text";

const sampleDescription =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat.";

export default defineType({
  name: "relumeLayout351",
  title: "Layout 351",
  type: "object",
  description:
    "Relume feature section: text align left, accordion, image, benefits section, services section. Features sit side by side as narrow numbered columns; the one a visitor clicks opens wide to show its heading, text and photo (one under another on a phone).",
  initialValue: {
    tagline: "Tagline",
    heading: "Medium length section heading goes here",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    features: ["one", "two", "three", "four"].map((number, index) => ({
      _key: `feature-${index + 1}`,
      _type: "feature",
      label: `Feature ${number}`,
      heading: "Short heading goes here",
      description: sampleDescription,
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
        "Each feature is one column; the first one starts open. Each is numbered by its place in the list.",
      of: [
        defineArrayMember({
          name: "feature",
          type: "object",
          fields: [
            defineField({
              name: "label",
              type: "string",
              description:
                "The feature's name on its closed column, read from bottom to top on a desktop, such as “Planning”. Keep it short.",
              validation: (rule) =>
                requiredText(
                  rule,
                  "Add the label. The feature is not shown without it.",
                ),
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
            select: { title: "label", subtitle: "heading", media: "image" },
          },
        }),
      ],
      validation: (rule) => [
        rule.required().min(1).error("Add at least one feature."),
        rule
          .max(5)
          .error(
            "Add at most 5 features: with more, the open one is too narrow on a laptop.",
          ),
      ],
    }),
  ],
  preview: {
    select: { title: "heading" },
    prepare: ({ title }) => ({
      title: title || "Untitled Layout 351",
      subtitle: "Layout 351",
    }),
  },
});
