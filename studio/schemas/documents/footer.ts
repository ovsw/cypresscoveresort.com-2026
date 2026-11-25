import { Columns3, Link, PanelBottom } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import { requiredText } from "../validation/required-text";
import { defineDestinationType } from "../blocks/shared/destination";

const destination = defineDestinationType("footerDestination");

const footerLink = defineType({
  name: "footerLink",
  title: "Footer link",
  type: "object",
  icon: Link,
  fields: [
    defineField({
      name: "label",
      type: "string",
      validation: (rule) => requiredText(rule),
    }),
    defineField({ name: "destination", type: "footerDestination" }),
  ],
  preview: { select: { title: "label" } },
});

const footerColumn = defineType({
  name: "footerColumn",
  title: "Footer column",
  type: "object",
  icon: Columns3,
  fields: [
    defineField({
      name: "heading",
      type: "string",
      validation: (rule) => requiredText(rule),
    }),
    defineField({
      name: "links",
      type: "array",
      of: [defineArrayMember({ type: "footerLink" })],
      validation: (rule) => rule.required().min(1).unique(),
    }),
  ],
  preview: {
    select: { title: "heading", links: "links" },
    prepare: ({ title, links }) => ({
      title,
      subtitle: `${links?.length ?? 0} link${links?.length === 1 ? "" : "s"}`,
    }),
  },
});

const footer = defineType({
  name: "footer",
  title: "Site Footer",
  type: "document",
  icon: PanelBottom,
  fields: [
    defineField({
      name: "newsletter",
      title: "Newsletter signup",
      type: "object",
      description:
        "The signup row at the top of the footer. Leave the heading empty to hide the row.",
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({
          name: "heading",
          type: "string",
          description: "The newsletter's name or a short invitation.",
          placeholder: "e.g. The weekly bulletin",
        }),
        defineField({
          name: "text",
          type: "text",
          rows: 2,
          description: "One or two sentences on what subscribers get and how often.",
          placeholder: "e.g. What's on this week, straight from the resort.",
        }),
        defineField({
          name: "inputPlaceholder",
          title: "Email field placeholder",
          type: "string",
          description: "Faint text inside the empty email field.",
          placeholder: "e.g. Your email address",
        }),
        defineField({
          name: "buttonLabel",
          title: "Button label",
          type: "string",
          description: "The word on the submit button. Subscribe when empty.",
          placeholder: "e.g. Subscribe",
        }),
        defineField({
          name: "successMessage",
          title: "Success message",
          type: "string",
          description: "Shown in place of the form after someone subscribes.",
          placeholder: "e.g. You are on the list.",
        }),
        defineField({
          name: "errorMessage",
          title: "Error message",
          type: "string",
          description:
            "Shown under the form when the signup could not be sent. Offer another way to subscribe.",
          placeholder: "e.g. That did not send. Try again.",
        }),
      ],
    }),
    defineField({
      name: "columns",
      title: "Navigation columns",
      type: "array",
      of: [defineArrayMember({ type: "footerColumn" })],
      validation: (rule) => rule.max(4),
    }),
    defineField({
      name: "legalLinks",
      title: "Legal links",
      type: "array",
      of: [defineArrayMember({ type: "footerLink" })],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: "copyrightStartYear",
      title: "Copyright start year",
      type: "number",
      validation: (rule) => rule.required().integer().min(1900),
    }),
    defineField({
      name: "copyrightOwner",
      title: "Copyright owner",
      type: "string",
      validation: (rule) => requiredText(rule),
    }),
  ],
  preview: { prepare: () => ({ title: "Site Footer" }) },
});

export const footerSchemaTypes = [destination, footerLink, footerColumn];

export default footer;
