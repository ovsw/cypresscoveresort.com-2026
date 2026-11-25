import { PencilRulerIcon } from "lucide-react";
import { defineField, defineType } from "sanity";
import { requiredText } from "../validation/required-text";

// A Scaffold holds a page's content before a real block exists for it. The
// AI page-build workflow drafts every page as Scaffolds, then replaces each
// one with a block from the site's library and moves the Scaffold to the
// document's `blocksArchive`.
export default defineType({
  name: "scaffold",
  title: "Scaffold",
  type: "object",
  icon: PencilRulerIcon,
  description:
    "A placeholder block that holds the intended content until a real block replaces it.",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      description: "Internal label for this placeholder.",
      validation: (rule) =>
        requiredText(rule, "Add a name. The Scaffold is not shown without it."),
    }),
    defineField({
      name: "richText",
      title: "Content",
      type: "richTextContent",
      description:
        "The complete intended content for this block, including images and links.",
    }),
    defineField({
      name: "proposedBlockShape",
      title: "Proposed block shape",
      type: "text",
      rows: 3,
      description:
        "A suggested presentation for the real block that replaces this Scaffold.",
    }),
  ],
  preview: {
    select: { name: "name", shape: "proposedBlockShape" },
    prepare: ({ name, shape }) => ({
      title: name || "Untitled Scaffold",
      subtitle: shape ? `Scaffold: ${shape}` : "Scaffold",
    }),
  },
});
