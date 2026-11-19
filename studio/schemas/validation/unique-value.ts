import type { ValidationContext } from "sanity";

type SlugValue = { current?: string };

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Finds another document of the same type that holds `value` at `path`.
 * Every version of the document being edited is left out, so a draft or a
 * release version never collides with its own published copy.
 */
async function findCollision(
  context: ValidationContext,
  path: string,
  value: string,
) {
  const documentId = context.document?._id;
  const documentType = context.document?._type;
  if (!documentId || !documentType) return null;

  const publishedId = documentId
    .replace(/^drafts\./, "")
    .replace(/^versions\.[^.]+\./, "");
  const client = context
    .getClient({ apiVersion: "2026-03-23" })
    .withConfig({ perspective: "raw" });
  return client.fetch<{ _id: string } | null>(
    `*[
      _type == $documentType &&
      !sanity::versionOf($publishedId) &&
      ${path} == $value
    ][0]{_id}`,
    { documentType, publishedId, value },
  );
}

/**
 * A plain value (a SKU, a date) that only one document of its type may hold.
 * `label` names the thing in the message, for example "product".
 */
export function uniqueValue(field: string, label: string) {
  return async (value: string | undefined, context: ValidationContext) => {
    if (!value) return true;
    return (await findCollision(context, field, value))
      ? `Another ${label} already uses ${value}`
      : true;
  };
}

/**
 * A slug that is one URL segment and that only one document of its type may
 * hold. For the collections that get their own page: events, products,
 * product categories and property listings.
 */
export function uniqueSlug(label: string) {
  return async (value: SlugValue | undefined, context: ValidationContext) => {
    const current = value?.current;
    if (!current) return true;
    if (!SLUG_PATTERN.test(current)) {
      return "Use lowercase letters, numbers, and single hyphens only";
    }
    return (await findCollision(context, "slug.current", current))
      ? `Another ${label} already uses the slug ${current}`
      : true;
  };
}

/**
 * Turns off the slug field's built-in uniqueness check. `uniqueSlug` does
 * that check, with a message that names the type and without colliding with
 * the document's own release versions.
 */
export const slugIsUnique = () => true;

/** An end date that is not before the document's `startDate`. */
export function notBeforeStartDate(
  value: string | undefined,
  context: ValidationContext,
) {
  const start = context.document?.startDate;
  if (!value || typeof start !== "string") return true;
  return value < start ? "The end date cannot be before the start date" : true;
}
