import { BookOpen, UtensilsCrossed } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import { photoField } from "../objects/shared-fields";
import { requiredText } from "../validation/required-text";

const menuItem = defineType({
  name: "menuItem",
  title: "Menu item",
  type: "object",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      description: "The dish or drink.",
      validation: (rule) => requiredText(rule),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "string",
      description: "Optional. What is in it or what comes with it.",
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "string",
      description: "The price as it should read, with the currency sign.",
      placeholder: "e.g. $00",
    }),
  ],
  preview: { select: { title: "name", subtitle: "price" } },
});

const menuSection = defineType({
  name: "menuSection",
  title: "Menu section",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "The heading for this group of items.",
      placeholder: "e.g. Sandwiches",
      validation: (rule) => requiredText(rule),
    }),
    defineField({
      name: "items",
      title: "Items",
      type: "array",
      description: "The dishes or drinks in this group.",
      of: [defineArrayMember({ type: "menuItem" })],
      validation: (rule) =>
        rule.required().min(1).error("Add at least one item to the section."),
    }),
  ],
  preview: {
    select: { items: "items", title: "title" },
    prepare: ({ items, title }) => ({
      title,
      subtitle: `${items?.length ?? 0} items`,
    }),
  },
});

const venueMenu = defineType({
  name: "venueMenu",
  title: "Menu",
  type: "object",
  icon: BookOpen,
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "The menu's name.",
      placeholder: "e.g. Breakfast",
      validation: (rule) => requiredText(rule),
    }),
    defineField({
      name: "sections",
      title: "Sections",
      type: "array",
      description: "The groups of items on this menu, in the order shown.",
      of: [defineArrayMember({ type: "menuSection" })],
      validation: (rule) =>
        rule.required().min(1).error("Add at least one section to the menu."),
    }),
  ],
  preview: { select: { title: "title" } },
});

const venue = defineType({
  name: "venue",
  title: "Venue",
  type: "document",
  icon: UtensilsCrossed,
  description: "A place to eat or drink at the resort, with its hours and menus.",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      description: "The venue's name as guests know it.",
      validation: (rule) => requiredText(rule),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
      description: "What the venue is and what it is for.",
    }),
    photoField({
      name: "image",
      title: "Photo",
      description: "Shown on the venue's card.",
    }),
    defineField({
      name: "phone",
      title: "Phone",
      type: "string",
      description: "The number guests call to reach the venue.",
      placeholder: "e.g. (555) 010-0100",
    }),
    defineField({
      name: "hours",
      title: "Hours",
      type: "openingHours",
      description: "When the venue is open.",
    }),
    defineField({
      name: "menus",
      title: "Menus",
      type: "array",
      description: "The venue's menus as text, so guests can read them on a phone.",
      of: [defineArrayMember({ type: "venueMenu" })],
    }),
    defineField({
      name: "menuPdf",
      title: "Menu PDF",
      type: "file",
      description:
        "Optional. A PDF offered as a download next to the text menus, or in their place until they are typed in.",
      options: { accept: "application/pdf" },
    }),
    defineField({
      name: "mapLocation",
      title: "Map location",
      type: "reference",
      to: [{ type: "mapLocation" }],
      description: "The venue's pin on the interactive map.",
    }),
  ],
  preview: {
    select: { media: "image", title: "name" },
    prepare: ({ media, title }) => ({ title: title || "Untitled venue", media }),
  },
});

export const venueSchemaTypes = [menuItem, menuSection, venueMenu];

export default venue;
