import { Tags } from "lucide-react";
import { defineField, defineType } from "sanity";
import { requiredText } from "../validation/required-text";
import { slugIsUnique, uniqueSlug } from "../validation/unique-value";

export default defineType({
  name: "productCategory",
  title: "Product category",
  type: "document",
  icon: Tags,
  description: "A group of products in the store.",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "The category's name in the store.",
      placeholder: "e.g. Apparel",
      validation: (rule) => requiredText(rule),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "The last part of the category's address.",
      options: { source: "title", maxLength: 96, isUnique: slugIsUnique },
      validation: (rule) => rule.required().custom(uniqueSlug("product category")),
    }),
    defineField({
      name: "sortOrder",
      title: "Sort order",
      type: "number",
      description: "Lower numbers are listed first.",
    }),
  ],
  orderings: [
    {
      title: "Sort order",
      name: "sortOrderAsc",
      by: [
        { field: "sortOrder", direction: "asc" },
        { field: "title", direction: "asc" },
      ],
    },
  ],
  preview: { select: { title: "title", subtitle: "slug.current" } },
});
