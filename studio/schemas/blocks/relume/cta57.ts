// Hand-finished from relume/source/cta57.tsx (Relume CTA 57): its heading is
// a list of lines (`headers: string[]`), each sliding in from alternating
// sides, which the converter cannot model. Listed under "Hand-finished
// blocks" in docs/agents/relume-import.md; do not regenerate.
import { defineArrayMember, defineField, defineType } from "sanity";
import blockTheme from "../shared/block-theme";
import { requiredText } from "../../validation/required-text";

export default defineType({
  name: "relumeCta57",
  title: "CTA 57",
  type: "object",
  description:
    "Relume cta section: 1 column, text align center, buttons, text only, cta section.",
  initialValue: {
    headingLines: ["Medium length CTA", "heading goes here"],
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique.",
  },
  fields: [
    blockTheme,
    defineField({
      name: "headingLines",
      title: "Heading lines",
      type: "array",
      description:
        "The heading, one line per item. Each line slides in from alternating sides.",
      of: [
        defineArrayMember({
          type: "string",
          validation: (rule) =>
            requiredText(rule, "Write this line, or remove it."),
        }),
      ],
      validation: (rule) =>
        rule
          .required()
          .min(1)
          .max(3)
          .error(
            "Add one to three heading lines. The block is not shown without one.",
          ),
    }),
    defineField({
      name: "description",
      type: "string",
    }),
    defineField({
      name: "buttons",
      type: "array",
      of: [defineArrayMember({ type: "button" })],
      validation: (rule) => rule.max(2),
    }),
  ],
  preview: {
    select: { lines: "headingLines" },
    prepare: ({ lines }) => ({
      title:
        (Array.isArray(lines) ? lines.filter(Boolean).join(" ") : "") ||
        "Untitled CTA 57",
      subtitle: "CTA 57",
    }),
  },
});
