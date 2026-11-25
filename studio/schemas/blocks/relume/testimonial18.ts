// Hand-finished from relume/source/testimonial18.tsx (Relume Testimonial 18).
// Listed under "Hand-finished blocks" in docs/agents/relume-import.md, so the
// converter never regenerates it.
import { defineArrayMember, defineField, defineType } from "sanity";
import blockTheme from "../shared/block-theme";
import { requiredText } from "../../validation/required-text";

const sampleQuote =
  '"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare."';
// The cards stack in masonry columns, so Relume's sample mixes two lengths.
const longSampleQuote =
  '"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat."';

const sampleTestimonial = (index: number) => ({
  _key: `testimonial-${index}`,
  _type: "testimonial",
  rating: 5,
  quote: [2, 3, 4].includes(index) ? longSampleQuote : sampleQuote,
  name: "Name Surname",
  jobTitle: "Position",
  companyName: "Company name",
});

export default defineType({
  name: "relumeTestimonial18",
  title: "Testimonial 18",
  type: "object",
  description:
    "Relume testimonial section: 3 columns, text align center, text align left, avatar image, star rating, reviews section.",
  initialValue: {
    heading: "Customer testimonials",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    testimonials: [1, 2, 3, 4, 5, 6].map(sampleTestimonial),
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
      name: "testimonials",
      type: "array",
      of: [
        defineArrayMember({
          name: "testimonial",
          type: "object",
          fields: [
            defineField({
              name: "rating",
              type: "number",
              description:
                "How many stars the reviewer gave, from 1 to 5. The card shows that many filled stars.",
              initialValue: 5,
              validation: (rule) =>
                rule
                  .required()
                  .integer()
                  .min(1)
                  .max(5)
                  .error("Give a whole number of stars from 1 to 5."),
            }),
            defineField({
              name: "quote",
              type: "text",
              rows: 3,
              validation: (rule) =>
                requiredText(
                  rule,
                  "Add the quote. The testimonial is not shown without it.",
                ),
            }),
            defineField({
              name: "avatar",
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
                  .error("Add the avatar. The item needs it."),
            }),
            defineField({
              name: "name",
              type: "string",
              validation: (rule) =>
                requiredText(
                  rule,
                  "Add the name. The item is not shown without it.",
                ),
            }),
            defineField({
              name: "jobTitle",
              type: "string",
            }),
            defineField({
              name: "companyName",
              type: "string",
            }),
          ],
          preview: {
            select: { title: "name", rating: "rating", media: "avatar" },
            prepare: ({ title, rating, media }) => ({
              title,
              subtitle:
                typeof rating === "number"
                  ? `${rating} out of 5 stars`
                  : undefined,
              media,
            }),
          },
        }),
      ],
      validation: (rule) =>
        rule.required().min(1).error("Add at least one item to testimonials."),
    }),
  ],
  preview: {
    select: { title: "heading" },
    prepare: ({ title }) => ({
      title: title || "Untitled Testimonial 18",
      subtitle: "Testimonial 18",
    }),
  },
});
