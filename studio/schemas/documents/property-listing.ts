import { KeyRound } from "lucide-react";
import { defineField, defineType } from "sanity";
import meta from "../blocks/shared/meta";
import { photosField } from "../objects/shared-fields";
import { requiredText } from "../validation/required-text";
import { slugIsUnique, uniqueSlug } from "../validation/unique-value";

export const LISTING_TYPES = [
  { title: "For sale", value: "sale" },
  { title: "For rent", value: "rent" },
];

export const LISTING_STATUSES = [
  { title: "Available", value: "available" },
  { title: "Pending", value: "pending" },
  { title: "Sold or rented", value: "closed" },
];

export default defineType({
  name: "propertyListing",
  title: "Property listing",
  type: "document",
  icon: KeyRound,
  description: "A home or lot for sale or rent inside the resort.",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "seo", title: "SEO" },
  ],
  initialValue: { listingType: "sale", status: "available" },
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "content",
      description: "The listing's headline.",
      placeholder: "e.g. Two-bedroom home by the lake",
      validation: (rule) => requiredText(rule),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "content",
      description: "The last part of the listing page's address.",
      options: { source: "title", maxLength: 96, isUnique: slugIsUnique },
      validation: (rule) => rule.required().custom(uniqueSlug("property listing")),
    }),
    defineField({
      name: "listingType",
      title: "Listing type",
      type: "string",
      group: "content",
      description: "Whether the property is for sale or for rent.",
      options: { list: LISTING_TYPES, layout: "radio", direction: "horizontal" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      group: "content",
      description:
        "Change this when the property is under contract or gone, so the listing does not have to be deleted that day.",
      options: { list: LISTING_STATUSES, layout: "radio", direction: "horizontal" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "number",
      group: "content",
      description:
        "A number without the currency sign. For a rental, the monthly rent.",
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "bedrooms",
      title: "Bedrooms",
      type: "number",
      group: "content",
      description: "Optional. The number of bedrooms.",
      validation: (rule) => rule.min(0).integer(),
    }),
    defineField({
      name: "bathrooms",
      title: "Bathrooms",
      type: "number",
      group: "content",
      description: "Optional. Use .5 for a half bath.",
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "details",
      title: "Description",
      type: "simpleRichText",
      group: "content",
      description: "The full description of the property.",
    }),
    photosField({
      name: "photos",
      title: "Photos",
      group: "content",
      description: "The first photo is the main one.",
    }),
    defineField({
      name: "contact",
      title: "Contact",
      type: "object",
      group: "content",
      description: "Who a buyer or renter gets in touch with.",
      fields: [
        defineField({
          name: "name",
          title: "Name",
          type: "string",
          description: "The person or office handling the listing.",
        }),
        defineField({
          name: "phone",
          title: "Phone",
          type: "string",
          description: "The number to call about this listing.",
          placeholder: "e.g. (555) 010-0100",
        }),
        defineField({
          name: "email",
          title: "Email",
          type: "email",
          description: "The address inquiries go to.",
        }),
      ],
    }),
    meta,
  ],
  preview: {
    select: {
      listingType: "listingType",
      media: "photos.0",
      status: "status",
      title: "title",
    },
    prepare: ({ listingType, media, status, title }) => ({
      title: title || "Untitled listing",
      subtitle: [
        LISTING_TYPES.find((entry) => entry.value === listingType)?.title,
        LISTING_STATUSES.find((entry) => entry.value === status)?.title,
      ]
        .filter(Boolean)
        .join(" · "),
      media,
    }),
  },
});
