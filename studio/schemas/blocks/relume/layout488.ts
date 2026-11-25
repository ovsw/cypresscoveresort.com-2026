// Hand-finished from relume/source/layout488.tsx (Relume Layout 488). Listed
// under "Hand-finished blocks" in docs/agents/relume-import.md; do not
// regenerate.
import { defineField, defineType } from "sanity";
import blockTheme from "../shared/block-theme";
import { requiredText } from "../../validation/required-text";

// On a desktop each half's size follows its own length: a word or two is
// drawn very large, a longer phrase smaller so it holds to about three lines.
// Past this length it gets small.
const headingPartMaxLength = 40;

export default defineType({
  name: "relumeLayout488",
  title: "Layout 488",
  type: "object",
  description:
    "Relume feature section: text align center, image/video center, 1 column, image. A round photo between the two halves of a large heading grows as you scroll, then a circle widens behind it, showing a background photo, until the photo fills the screen.",
  initialValue: {
    headingStart: "Heading",
    headingEnd: "goes here",
  },
  fields: [
    blockTheme,
    defineField({
      name: "headingStart",
      title: "Heading, first part",
      type: "string",
      description:
        "The words left of the photo, such as “Made to”. A word or two is drawn very large on a desktop; a longer phrase is drawn smaller, to fit in about three lines.",
      validation: (rule) => [
        requiredText(
          rule,
          "Add the first part of the heading. The block is not shown without it.",
        ),
        rule
          .max(headingPartMaxLength)
          .warning(
            `Keep it to ${headingPartMaxLength} characters or fewer, or the heading is drawn small on a desktop.`,
          ),
      ],
    }),
    defineField({
      name: "image",
      type: "image",
      description: "Drawn as a circle, so keep the subject in the middle.",
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
          .error("Add the image. The block needs it."),
    }),
    defineField({
      name: "headingEnd",
      title: "Heading, second part",
      type: "string",
      description:
        "The words right of the photo, such as “last”. On a phone both parts are drawn as one line under the photo.",
      validation: (rule) => [
        requiredText(
          rule,
          "Add the second part of the heading. The block is not shown without it.",
        ),
        rule
          .max(headingPartMaxLength)
          .warning(
            `Keep it to ${headingPartMaxLength} characters or fewer, or the heading is drawn small on a desktop.`,
          ),
      ],
    }),
    defineField({
      name: "backgroundImage",
      title: "Background photo",
      type: "image",
      description:
        "Fills the whole block, seen through the circle that widens behind the round photo as the visitor scrolls, until it fills the screen. Pick a wide photo with a calm middle: the heading is drawn over it in white.",
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
          .error("Add the background photo. The block needs it."),
    }),
  ],
  preview: {
    select: { start: "headingStart", end: "headingEnd", media: "image" },
    prepare: ({ start, end, media }) => ({
      title: [start, end].filter(Boolean).join(" ") || "Untitled Layout 488",
      subtitle: "Layout 488",
      media,
    }),
  },
});
