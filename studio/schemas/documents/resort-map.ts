import { Map } from "lucide-react";
import { defineType } from "sanity";
import { photoField } from "../objects/shared-fields";

export default defineType({
  name: "resortMap",
  title: "Resort map",
  type: "document",
  icon: Map,
  description:
    "The aerial photo behind the interactive map. The pins are Map location records.",
  fields: [
    photoField({
      name: "image",
      title: "Aerial photo",
      description:
        "Replacing the photo keeps every pin's position, so check the pins after uploading a photo taken from a different angle.",
      required: true,
    }),
  ],
  preview: {
    select: { media: "image" },
    prepare: ({ media }) => ({ title: "Resort map", media }),
  },
});
