import type { PortableTextProps } from "@portabletext/react";
import { CustomLinkMarkRenderer } from "@/components/portable-text/custom-link-mark";

// Inline content for the description slots of Page Builder blocks built from Shadcnblocks.
export const simpleRichTextComponents: PortableTextProps["components"] = {
  block: {
    normal: ({ children }) => <p>{children}</p>,
  },
  marks: {
    customLink: CustomLinkMarkRenderer,
  },
};
