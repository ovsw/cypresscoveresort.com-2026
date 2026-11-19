import { Store } from "lucide-react";
import { defineField, defineType } from "sanity";
import meta from "../blocks/shared/meta";
import { requiredText } from "../validation/required-text";

export default defineType({
  name: "storeIndex",
  title: "Store page",
  type: "document",
  icon: Store,
  description: "The heading and SEO fields of the store's front page.",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "content",
      description: "The store page's heading.",
      validation: (rule) => requiredText(rule),
    }),
    defineField({
      name: "description",
      title: "Intro",
      type: "text",
      rows: 3,
      group: "content",
      description: "Optional. A sentence or two under the heading.",
    }),
    meta,
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({ title: title || "Store page", subtitle: "/store" }),
  },
});
