import { MapPin } from "lucide-react";
import { defineField, defineType } from "sanity";
import { MapPositionInput } from "../inputs/map-position-input";
import { photosField } from "../objects/shared-fields";
import { requiredText } from "../validation/required-text";

const axis = (name: "x" | "y", title: string, description: string) =>
  defineField({
    name,
    title,
    type: "number",
    description,
    placeholder: "e.g. 42.5",
    validation: (rule) => [
      rule.required().error("Required."),
      rule.min(0).max(100).error("Use a number from 0 to 100."),
    ],
  });

export default defineType({
  name: "mapLocation",
  title: "Map location",
  type: "document",
  icon: MapPin,
  description: "One pin on the interactive map, with its blurb and photos.",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      description: "The place's name as shown on the pin.",
      placeholder: "e.g. Game Room",
      validation: (rule) => requiredText(rule),
    }),
    defineField({
      name: "blurb",
      title: "Blurb",
      type: "text",
      rows: 4,
      description: "The paragraph shown when a visitor opens the pin.",
    }),
    photosField({
      name: "photos",
      title: "Photos",
      description: "The first photo is the large one; the others are thumbnails.",
    }),
    defineField({
      name: "position",
      title: "Pin position",
      type: "object",
      description:
        "Click the aerial photo where the pin sits. Click again to move it, or use the arrow keys.",
      options: { columns: 2 },
      components: { input: MapPositionInput },
      fields: [
        axis("x", "From the left (%)", "0 is the left edge, 100 the right edge."),
        axis("y", "From the top (%)", "0 is the top edge, 100 the bottom edge."),
      ],
      validation: (rule) => rule.required().error("Set where the pin sits."),
    }),
    defineField({
      name: "button",
      title: "Button",
      type: "button",
      description:
        "Optional. A button in the pin's panel, such as Book Now or See the menu.",
    }),
  ],
  preview: {
    select: { media: "photos.0", title: "name" },
    prepare: ({ media, title }) => ({
      title: title || "Untitled location",
      media,
    }),
  },
});
