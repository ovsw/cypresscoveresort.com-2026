// Loads the Studio's real schema types for tests that run Studio's own
// validation on documents. Import this before anything else from the Studio.
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const studioUrl = new URL("../../", import.meta.url).href;
const isStudioSource = (url) =>
  url?.startsWith(studioUrl) && !url.includes("/node_modules/");

// The Studio's schema files import without file extensions and import custom
// inputs written in TSX, as the Studio bundler allows. Node needs both
// resolved: try `.ts` and `.tsx`, and compile TSX with TypeScript.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (
        error?.code !== "ERR_MODULE_NOT_FOUND" ||
        !specifier.startsWith(".") ||
        !isStudioSource(context.parentURL)
      ) {
        throw error;
      }
      for (const extension of [".ts", ".tsx"]) {
        try {
          return nextResolve(`${specifier}${extension}`, context);
        } catch {
          // Try the next extension.
        }
      }
      throw error;
    }
  },
  load(url, context, nextLoad) {
    if (!url.endsWith(".tsx") || !isStudioSource(url)) {
      return nextLoad(url, context);
    }
    const source = ts.transpileModule(
      readFileSync(fileURLToPath(url), "utf8"),
      {
        compilerOptions: {
          jsx: ts.JsxEmit.ReactJSX,
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
        },
      },
    ).outputText;
    return { format: "module", shortCircuit: true, source };
  },
});

process.env.SANITY_STUDIO_TITLE ??= "Validation test";
export const { schemaTypes } = await import("../../schema-types.ts");
export const { createSchema, validateDocument } = await import("sanity");

/**
 * Returns `errors(document)` and `errorPaths(document)` for a schema.
 * `fetch` answers the queries validation rules make, such as a uniqueness
 * check; by default nothing is found.
 */
export function createValidator(schema, fetch = async () => null) {
  const client = {
    config: () => ({}),
    fetch: (...args) => fetch(...args),
    withConfig: () => client,
  };

  /** Error messages by path, for example `{ "button.text": "Add the …" }`. */
  async function errors(document) {
    const markers = await validateDocument({
      document: { _id: "drafts.test", ...document },
      // "cli" adds an unknown-fields check that turns object rules into
      // warnings; "studio" validates as the editor sees it.
      environment: "studio",
      getDocumentExists: async () => true,
      workspace: { getClient: () => client, schema },
    });
    return Object.fromEntries(
      markers
        .filter((marker) => marker.level === "error")
        .map((marker) => [
          marker.path
            .map((segment) =>
              typeof segment === "object" ? `[${segment._key}]` : segment,
            )
            .join("."),
          marker.message,
        ]),
    );
  }

  /** The paths with an error, sorted: Studio reports them in no fixed order. */
  async function errorPaths(document) {
    return Object.keys(await errors(document)).sort();
  }

  return { errors, errorPaths };
}
