import { Mail } from "lucide-react";
import { defineField, defineType } from "sanity";
import { requiredText } from "../validation/required-text";
import { realDate } from "../validation/unique-value";

export default defineType({
  name: "newsletterIssue",
  title: "Newsletter issue",
  type: "document",
  icon: Mail,
  description:
    "One issue of the newsletter. The newest one shows on Today at the Cove; all of them make the archive.",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "The issue's subject line.",
      validation: (rule) => requiredText(rule),
    }),
    defineField({
      name: "date",
      title: "Date",
      type: "date",
      description: "The day the issue went out.",
      validation: (rule) => rule.required().custom(realDate),
    }),
    defineField({
      name: "url",
      title: "Link",
      type: "url",
      description:
        "The web address of the issue. Add this, a PDF, or both; an issue needs at least one.",
      placeholder: "e.g. https://example.com/newsletter/issue",
      validation: (rule) => [
        rule.uri({ scheme: ["http", "https"] }),
        rule.custom((value, context) =>
          value || (context.document?.file as { asset?: unknown } | undefined)?.asset
            ? true
            : "Add a link or upload a PDF. An issue with neither leads nowhere.",
        ),
      ],
    }),
    defineField({
      name: "file",
      title: "PDF",
      type: "file",
      description: "The issue as a PDF, when it has no web address.",
      options: { accept: "application/pdf" },
    }),
  ],
  orderings: [
    {
      title: "Date, newest first",
      name: "dateDesc",
      by: [{ field: "date", direction: "desc" }],
    },
  ],
  preview: { select: { title: "title", subtitle: "date" } },
});
