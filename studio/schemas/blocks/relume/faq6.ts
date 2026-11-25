// Hand-finished from relume/source/faq6.tsx (Relume FAQ 6): the converter
// cannot carry over its accordion or its single button. Listed under
// "Hand-finished blocks" in docs/agents/relume-import.md; do not regenerate.
import { defineArrayMember, defineField, defineType } from "sanity";
import blockTheme from "../shared/block-theme";
import { requiredText } from "../../validation/required-text";

const sampleAnswer =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat. Aenean faucibus nibh et justo cursus id rutrum lorem imperdiet. Nunc ut sem vitae risus tristique posuere.";

export default defineType({
  name: "relumeFaq6",
  title: "FAQ 6",
  type: "object",
  description:
    "Relume faq section: 2 columns, text align left, buttons, text only, accordion, faq section.",
  initialValue: {
    heading: "FAQs",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique.",
    questions: [1, 2, 3, 4, 5].map((number) => ({
      _key: `question-${number}`,
      _type: "question",
      title: "Question text goes here",
      answer: sampleAnswer,
    })),
  },
  fields: [
    blockTheme,
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
      type: "string",
    }),
    defineField({
      name: "buttons",
      type: "array",
      of: [defineArrayMember({ type: "button" })],
      validation: (rule) => rule.max(1),
    }),
    defineField({
      name: "questions",
      type: "array",
      description: "Each question opens to show its answer.",
      of: [
        defineArrayMember({
          name: "question",
          type: "object",
          fields: [
            defineField({
              name: "title",
              title: "Question",
              type: "string",
              validation: (rule) =>
                requiredText(
                  rule,
                  "Add the question. The item is not shown without it.",
                ),
            }),
            defineField({
              name: "answer",
              type: "text",
              rows: 4,
              validation: (rule) =>
                requiredText(rule, "Add the answer to this question."),
            }),
          ],
          preview: { select: { title: "title" } },
        }),
      ],
      validation: (rule) =>
        rule.required().min(1).error("Add at least one item to questions."),
    }),
  ],
  preview: {
    select: { title: "heading" },
    prepare: ({ title }) => ({
      title: title || "Untitled FAQ 6",
      subtitle: "FAQ 6",
    }),
  },
});
