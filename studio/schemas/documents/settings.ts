import { Contact, Globe2, ImageIcon, Settings } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import { requiredText } from "../validation/required-text";

const socialLink = defineType({
  name: "socialLink",
  title: "Social link",
  type: "object",
  icon: Globe2,
  fields: [
    defineField({
      name: "label",
      type: "string",
      description: "The network or community name shown to visitors.",
      validation: (rule) => requiredText(rule),
    }),
    defineField({
      name: "url",
      type: "url",
      validation: (rule) =>
        rule.required().uri({ scheme: ["http", "https"] }),
    }),
  ],
  preview: { select: { title: "label", subtitle: "url" } },
});

const contactDetails = defineType({
  name: "contactDetails",
  title: "Contact details",
  type: "object",
  icon: Contact,
  fields: [
    defineField({ name: "email", type: "email" }),
    defineField({
      name: "phone",
      type: "string",
      description: "Include the country or area code visitors should dial.",
    }),
    defineField({
      name: "addressLines",
      title: "Address",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      validation: (rule) => rule.max(4),
    }),
  ],
});

/** A link every button of one kind follows, set once for the whole Website. */
const actionLink = (name: string, title: string, description: string) =>
  defineField({
    name,
    title,
    type: "url",
    group: "links",
    description,
    placeholder: "e.g. https://example.com/book",
    validation: (rule) => rule.uri({ scheme: ["http", "https"] }),
  });

const settings = defineType({
  name: "settings",
  title: "Global Settings",
  type: "document",
  icon: Settings,
  groups: [
    { name: "identity", title: "Identity", default: true },
    { name: "contact", title: "Contact" },
    { name: "links", title: "Booking and login" },
    { name: "reviews", title: "Reviews" },
    { name: "banner", title: "Banner" },
  ],
  fields: [
    defineField({
      name: "siteName",
      title: "Site name",
      type: "string",
      group: "identity",
      validation: (rule) => requiredText(rule),
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "object",
      icon: ImageIcon,
      group: "identity",
      description:
        "Optional. When no logo is supplied, the header uses the site name as text.",
      fields: [
        defineField({
          name: "light",
          title: "For light backgrounds",
          type: "image",
          options: { hotspot: true },
        }),
        defineField({
          name: "dark",
          title: "For dark backgrounds",
          type: "image",
          options: { hotspot: true },
        }),
      ],
    }),
    defineField({
      name: "contact",
      type: "contactDetails",
      group: "contact",
    }),
    defineField({
      name: "socialLinks",
      title: "Social links",
      type: "array",
      group: "contact",
      of: [defineArrayMember({ type: "socialLink" })],
      validation: (rule) => rule.unique(),
    }),
    actionLink(
      "bookingUrl",
      "Book Now link",
      "Where every Book Now button goes: the booking engine's address.",
    ),
    actionLink(
      "dayPassUrl",
      "Buy Day Pass link",
      "Where every Buy Day Pass button goes.",
    ),
    actionLink(
      "loginUrl",
      "Member and resident login link",
      "Where the login link in the header and footer goes.",
    ),
    defineField({
      name: "reviewRating",
      title: "Review rating",
      type: "object",
      group: "reviews",
      description:
        "The rating quoted across the site. Change it here and it changes everywhere.",
      fields: [
        defineField({
          name: "rating",
          title: "Rating",
          type: "number",
          description: "The score out of 5.",
          placeholder: "e.g. 4.5",
          validation: (rule) =>
            rule.min(0).max(5).error("Use a number from 0 to 5."),
        }),
        defineField({
          name: "source",
          title: "Source",
          type: "string",
          description: "The review site the score comes from.",
          placeholder: "e.g. Tripadvisor",
        }),
        defineField({
          name: "url",
          title: "Link",
          type: "url",
          description: "Optional. The page where visitors can read the reviews.",
          validation: (rule) => rule.uri({ scheme: ["http", "https"] }),
        }),
      ],
    }),
    defineField({
      name: "banner",
      title: "Banner",
      type: "object",
      group: "banner",
      description:
        "A strip at the top of every page, for a closure or an announcement.",
      fields: [
        defineField({
          name: "enabled",
          title: "Show the banner",
          type: "boolean",
          description: "Switch off to hide the banner without deleting its text.",
          initialValue: false,
        }),
        defineField({
          name: "text",
          title: "Text",
          type: "string",
          description: "One short sentence.",
          placeholder: "e.g. The main pool is closed on Tuesday for maintenance",
          validation: (rule) =>
            rule.custom((value, context) =>
              (context.parent as { enabled?: boolean } | undefined)?.enabled &&
              !value?.trim()
                ? "Add the banner text, or switch the banner off."
                : true,
            ),
        }),
        defineField({
          name: "link",
          title: "Link",
          type: "customUrl",
          description: "Optional. Where the banner leads.",
        }),
      ],
    }),
  ],
  preview: {
    select: { media: "logo.light", title: "siteName" },
    prepare: ({ media, title }) => ({
      title: title || "Global Settings",
      subtitle: "Site identity and contact details",
      media,
    }),
  },
});

export const settingsSchemaTypes = [socialLink, contactDetails];

export default settings;
