import { defineArrayMember, defineField } from "sanity";

const altField = defineField({
  name: "alt",
  type: "string",
  title: "Alt text",
  description:
    "Describe the photo for screen readers. Leave empty if it is decorative or repeats nearby text.",
});

const hasAsset = (value: unknown) =>
  Boolean((value as { asset?: { _ref?: string } } | undefined)?.asset?._ref);

type FieldOptions = {
  name: string;
  title: string;
  description: string;
  group?: string;
};

/** One photo with alt text. */
export function photoField({ required, ...field }: FieldOptions & { required?: boolean }) {
  return defineField({
    ...field,
    type: "image",
    options: { hotspot: true },
    fields: [altField],
    // An image value can exist with alt text and no uploaded file, so
    // "required" alone does not prove there is a photo.
    validation: (rule) =>
      required
        ? rule.custom((value) =>
            hasAsset(value) ? true : "Upload the photo.",
          )
        : rule,
  });
}

/** A list of photos, each with alt text. The first one is the main photo. */
export function photosField({ min = 0, ...field }: FieldOptions & { min?: number }) {
  return defineField({
    ...field,
    type: "array",
    of: [
      defineArrayMember({
        type: "image",
        options: { hotspot: true },
        fields: [altField],
        validation: (rule) =>
          rule.custom((value) =>
            hasAsset(value)
              ? true
              : "Upload a photo, or remove this empty entry.",
          ),
      }),
    ],
    options: { layout: "grid" },
    validation: (rule) =>
      min > 0
        ? rule
            .required()
            .min(min)
            .error(`Add at least ${min === 1 ? "one photo" : `${min} photos`}.`)
        : rule,
  });
}
