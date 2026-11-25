import { createDataAttribute } from "next-sanity";

/**
 * Where a block sits in its document, for Studio's click-to-edit targets.
 * The Page Builder gives it to every block while a page is previewed. A
 * block that runs in the browser needs it in place of the `dataAttribute`
 * function, because a function cannot be passed to a Client Component.
 */
export type BlockEditing = {
  baseUrl: string;
  dataset: string;
  id: string;
  /** Path of the block inside the document. */
  path: string;
  projectId: string;
  type: string;
};

/** Builds the `dataAttribute` function of a block from `editing`. */
export function blockDataAttribute(editing?: BlockEditing) {
  if (!editing) return undefined;
  return (path: string) =>
    createDataAttribute({
      ...editing,
      path: `${editing.path}.${path}`,
    }).toString();
}
