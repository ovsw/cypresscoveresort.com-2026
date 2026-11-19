import { ListChecks, ShoppingBag } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import meta from "../blocks/shared/meta";
import { photosField } from "../objects/shared-fields";
import { requiredText } from "../validation/required-text";
import { slugIsUnique, uniqueSlug, uniqueValue } from "../validation/unique-value";

/**
 * The shipping categories configured in FoxyCart. Each value must match a
 * category code in the FoxyCart admin, which sets how that kind of product
 * ships. Add an entry here when a category is added there.
 */
export const SHIPPING_CATEGORIES = [
  { title: "Standard (ships with other items)", value: "DEFAULT" },
];

const productOptionValue = defineType({
  name: "productOptionValue",
  title: "Option value",
  type: "object",
  initialValue: { soldOut: false },
  fields: [
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      description: "The choice as the shopper sees it.",
      placeholder: "e.g. XL",
      validation: (rule) => requiredText(rule),
    }),
    defineField({
      name: "priceAdjustment",
      title: "Price adjustment",
      type: "number",
      description:
        "Optional. Added to the product's price when this value is chosen. Use a negative number to lower it.",
      placeholder: "e.g. 2",
    }),
    defineField({
      name: "weightAdjustment",
      title: "Weight adjustment (lb)",
      type: "number",
      description:
        "Optional. Added to the product's weight when this value is chosen.",
      placeholder: "e.g. 0.25",
    }),
    defineField({
      name: "skuSuffix",
      title: "SKU suffix",
      type: "string",
      description:
        "Optional. Added to the product's SKU on the order, so the packer knows which one to pick.",
      placeholder: "e.g. -XL",
    }),
    defineField({
      name: "soldOut",
      title: "Sold out",
      type: "boolean",
      description: "Shoppers see this value but cannot choose it.",
    }),
  ],
  preview: {
    select: { soldOut: "soldOut", title: "label" },
    prepare: ({ soldOut, title }) => ({
      title,
      subtitle: soldOut ? "Sold out" : undefined,
    }),
  },
});

const productOptionGroup = defineType({
  name: "productOptionGroup",
  title: "Option",
  type: "object",
  icon: ListChecks,
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      description: "What the shopper chooses.",
      placeholder: "e.g. Size",
      validation: (rule) => requiredText(rule),
    }),
    defineField({
      name: "values",
      title: "Values",
      type: "array",
      description: "The choices, in the order shown.",
      of: [defineArrayMember({ type: "productOptionValue" })],
      validation: (rule) => [
        rule.required().min(1).error("Add at least one value."),
        rule.custom((values: { label?: string }[] | undefined) => {
          const labels = (values ?? [])
            .map((value) => value.label?.trim().toLowerCase())
            .filter(Boolean);
          return new Set(labels).size === labels.length
            ? true
            : "Two values have the same label.";
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "name", values: "values" },
    prepare: ({ title, values }) => ({
      title,
      subtitle: (values ?? [])
        .map((value: { label?: string }) => value.label)
        .filter(Boolean)
        .join(", "),
    }),
  },
});

const product = defineType({
  name: "product",
  title: "Product",
  type: "document",
  icon: ShoppingBag,
  description: "One item in the store. FoxyCart handles the cart, shipping and payment.",
  groups: [
    { name: "basics", title: "Basics", default: true },
    { name: "selling", title: "Price and shipping" },
    { name: "options", title: "Options" },
    { name: "seo", title: "SEO" },
  ],
  initialValue: {
    featured: false,
    isNew: false,
    shippingCategory: SHIPPING_CATEGORIES[0].value,
    soldOut: false,
  },
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      group: "basics",
      description: "The product's name in the store and on the order.",
      validation: (rule) => requiredText(rule),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "basics",
      description: "The last part of the product page's address.",
      options: { source: "name", maxLength: 96, isUnique: slugIsUnique },
      validation: (rule) => rule.required().custom(uniqueSlug("product")),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "reference",
      group: "basics",
      to: [{ type: "productCategory" }],
      description: "Where the product is listed in the store.",
      validation: (rule) => rule.required(),
    }),
    photosField({
      name: "photos",
      title: "Photos",
      group: "basics",
      description:
        "The first photo is the main one. Add front, back and detail shots.",
      min: 1,
    }),
    defineField({
      name: "shortDescription",
      title: "Short description",
      type: "text",
      rows: 2,
      group: "basics",
      description: "One or two sentences shown next to the price.",
    }),
    defineField({
      name: "details",
      title: "Full description",
      type: "simpleRichText",
      group: "basics",
      description: "Materials, sizing, care and anything else worth knowing.",
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      group: "basics",
      description: "Shows the product in the store's featured row.",
    }),
    defineField({
      name: "isNew",
      title: "New",
      type: "boolean",
      group: "basics",
      description: "Shows a New label on the product.",
    }),
    defineField({
      name: "soldOut",
      title: "Sold out",
      type: "boolean",
      group: "basics",
      description:
        "The product stays visible but cannot be added to the cart. To sell out one size only, use the switch on that option value.",
    }),
    defineField({
      name: "sku",
      title: "SKU",
      type: "string",
      group: "selling",
      description:
        "The product's code on orders. It must be different for every product.",
      placeholder: "e.g. TEE-LOGO",
      validation: (rule) => [
        requiredText(rule),
        rule.custom(uniqueValue("sku", "product")),
      ],
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "number",
      group: "selling",
      description: "A number without the currency sign.",
      validation: (rule) => [
        rule.required().error("Required."),
        rule.min(0).error("The price cannot be negative."),
      ],
    }),
    defineField({
      name: "weight",
      title: "Weight (lb)",
      type: "number",
      group: "selling",
      description: "The packed weight in pounds. Shipping is calculated from it.",
      placeholder: "e.g. 0.5",
      validation: (rule) => [
        rule.required().error("Required."),
        rule.greaterThan(0).error("The weight must be more than zero."),
      ],
    }),
    defineField({
      name: "shippingCategory",
      title: "Shipping category",
      type: "string",
      group: "selling",
      description: "How the product ships. The choices match the store's shipping setup.",
      options: { list: SHIPPING_CATEGORIES },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "options",
      title: "Options",
      type: "array",
      group: "options",
      description:
        "Choices such as Size or Colour. Leave empty for a product that comes one way.",
      of: [defineArrayMember({ type: "productOptionGroup" })],
    }),
    meta,
  ],
  preview: {
    select: { media: "photos.0", sku: "sku", soldOut: "soldOut", title: "name" },
    prepare: ({ media, sku, soldOut, title }) => ({
      title: title || "Untitled product",
      subtitle: [sku, soldOut ? "Sold out" : undefined].filter(Boolean).join(" · "),
      media,
    }),
  },
});

export const productSchemaTypes = [productOptionValue, productOptionGroup];

export default product;
