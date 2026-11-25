#!/usr/bin/env node

import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { existsSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// The four files that register a block. `root` is the repository to work in:
// this one by default; `pnpm relume:add` and its tests pass another.
function registrationPaths(root = repoRoot) {
  return {
    blockTypes: resolve(root, "studio/schemas/blocks/page-builder.ts"),
    schemaTypes: resolve(root, "studio/schema-types.ts"),
    queries: resolve(root, "frontend/sanity/queries/page-builder.ts"),
    components: resolve(root, "frontend/components/blocks/index.tsx"),
  };
}

const scopeMarkers = {
  content: "  // page-builder-generator:content-types",
  general: "  // page-builder-generator:general-types",
  home: "  // page-builder-generator:home-types",
};

function usage() {
  return `Create and register a Page Builder block.

Usage:
  pnpm page-builder:new <name> [options]

Options:
  --title <title>       Studio title. Derived from the name by default.
  --scope <scope>       content, general, or home. Default: content.
  --preview <jpg>       Copy and register a Studio grid preview image.
  --dry-run             Print the planned files without writing them.
  --help                Show this help.

Examples:
  pnpm page-builder:new serviceHighlights
  pnpm page-builder:new service-highlights --title "Service Highlights"
  pnpm page-builder:new homeStats --scope home --preview ./home-stats.jpg`;
}

function parseArgs(argv) {
  const options = {
    dryRun: false,
    preview: undefined,
    scope: "content",
    title: undefined,
  };
  let name;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help") return { help: true };
    if (argument === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (argument.startsWith("--")) {
      const equals = argument.indexOf("=");
      const flag = equals < 0 ? argument : argument.slice(0, equals);
      const inlineValue = equals < 0 ? undefined : argument.slice(equals + 1);
      const value = inlineValue ?? argv[index + 1];
      if (!value || value.startsWith("--"))
        throw new Error(`${flag} needs a value`);
      if (inlineValue === undefined) index += 1;
      if (flag === "--title") options.title = value;
      else if (flag === "--scope") options.scope = value;
      else if (flag === "--preview")
        options.preview = resolve(process.cwd(), value);
      else throw new Error(`Unknown option: ${flag}`);
      continue;
    }
    if (name) throw new Error(`Unexpected argument: ${argument}`);
    name = argument;
  }

  if (!name) throw new Error("Provide a block name");
  if (!Object.hasOwn(scopeMarkers, options.scope)) {
    throw new Error("--scope must be content, general, or home");
  }
  return { help: false, name, ...options };
}

function getNames(input, explicitTitle) {
  if (!/^[a-zA-Z][a-zA-Z0-9]*(?:-[a-zA-Z0-9]+)*$/.test(input)) {
    throw new Error(
      "Block names must use letters, numbers, and single hyphens, starting with a letter",
    );
  }
  const words = input
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());

  if (!words.length || !/^[a-z]/.test(words[0])) {
    throw new Error("Block names must start with a letter");
  }

  const pascal = words
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join("");
  const camel = pascal[0].toLowerCase() + pascal.slice(1);
  if (
    new Set(
      "await break case catch class const continue debugger default delete do else enum export extends false finally for function if implements import in instanceof interface let new null package private protected public return static super switch this throw true try typeof var void while with yield arguments eval".split(
        " ",
      ),
    ).has(camel)
  ) {
    throw new Error("Block name cannot be a reserved JavaScript identifier");
  }
  return {
    camel: pascal[0].toLowerCase() + pascal.slice(1),
    kebab: words.join("-"),
    pascal,
    title:
      explicitTitle ??
      words.map((word) => word[0].toUpperCase() + word.slice(1)).join(" "),
  };
}

function insertAtMarker(source, marker, line, file) {
  const occurrences = source.split(marker).length - 1;
  if (occurrences !== 1) {
    throw new Error(`${file} must contain exactly one ${marker} marker`);
  }
  return source.replace(marker, `${line}\n${marker}`);
}

function schemaTemplate({ camel, title }) {
  return `import { defineField, defineType } from "sanity";
import blockTheme from "./shared/block-theme";

export default defineType({
  name: "${camel}",
  title: ${JSON.stringify(title)},
  type: "object",
  fields: [
    blockTheme,
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 3,
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title: previewTitle }) => ({
      title: previewTitle || ${JSON.stringify(`Untitled ${title}`)},
      subtitle: ${JSON.stringify(title)},
    }),
  },
});
`;
}

function queryTemplate({ camel }) {
  return `import { groq } from "next-sanity";

// @sanity-typegen-ignore
export const ${camel}Query = groq\`
  _type == "${camel}" => {
    theme,
    title,
    description
  }
\`;
`;
}

function componentTemplate({ camel, kebab, pascal }) {
  return `import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { stegaClean } from "next-sanity";
import {
  resolveBlockTheme,
  blockSceneClassName,
  type BlockSceneProps,
} from "./block-boundaries";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type ${pascal}Block = Extract<PageBlock, { _type: "${camel}" }>;

type ${pascal}Props = ${pascal}Block & {
  dataAttribute?: (path: string) => string | undefined;
} & BlockSceneProps;

// The Page Builder excludes blocks without content from visible adjacency.
// Keep this rule aligned with the renderer's empty result below.
export function has${pascal}Content(block: Pick<${pascal}Block, "title">) {
  return Boolean(stegaClean(block.title)?.trim());
}

export default function ${pascal}({
  _key,
  bottom = "outer",
  dataAttribute,
  description,
  theme,
  title,
  top = "outer",
}: ${pascal}Props) {
  if (!has${pascal}Content({ title })) return null;

  const headingId = \`${kebab}-\${stegaClean(_key)}-title\`;

  return (
    <section
      aria-labelledby={headingId}
      className={blockSceneClassName(resolveBlockTheme(theme), top, bottom)}
      data-sanity={dataAttribute?.("theme")}
      id={\`${kebab}-\${stegaClean(_key)}\`}
    >
      <div className="container">
        <div className="mx-auto max-w-3xl">
          <h2
            className="text-3xl font-extrabold tracking-tight"
            data-sanity={dataAttribute?.("title")}
            id={headingId}
          >
            {title}
          </h2>
          {stegaClean(description)?.trim() ? (
            <p
              className="mt-4 text-muted-foreground"
              data-sanity={dataAttribute?.("description")}
            >
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
`;
}

// `options.dir` and `options.fileName` place the three files in a subfolder
// under another file name, and `options.templates` supplies their contents.
// The Relume importer (scripts/relume/convert.mjs) uses them; the command
// line does not.
function blockFile(options, names) {
  if (
    [options.dir, options.fileName].some(
      (part) => part !== undefined && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(part),
    )
  ) {
    throw new Error("dir and fileName must be kebab-case");
  }
  return `${options.dir ? `${options.dir}/` : ""}${options.fileName ?? names.kebab}`;
}

function blockTargets(root, file, names) {
  return {
    schema: resolve(root, `studio/schemas/blocks/${file}.ts`),
    query: resolve(root, `frontend/sanity/queries/${file}.ts`),
    component: resolve(root, `frontend/components/blocks/${file}.tsx`),
    preview: resolve(root, `studio/static/images/preview/${names.camel}.jpg`),
  };
}

// Each registration line the generator writes for a block, by file and by
// the marker it goes above. Registering inserts them; unregistering removes
// exactly these lines, so the two cannot drift apart.
function registrationLines(names, file, scope) {
  return {
    blockTypes: [
      [scopeMarkers[scope], `  "${names.camel}",`],
      ["  // page-builder-generator:preview-types", `  "${names.camel}",`],
    ],
    schemaTypes: [
      [
        "// page-builder-generator:block-imports",
        `import ${names.camel} from "./schemas/blocks/${file}";`,
      ],
      ["  // page-builder-generator:block-types", `  ${names.camel},`],
    ],
    queries: [
      [
        "// page-builder-generator:query-imports",
        `import { ${names.camel}Query } from "./${file}";`,
      ],
      [
        '    ${"" /* page-builder-generator:query-spreads */}',
        `    \${${names.camel}Query},`,
      ],
    ],
    components: [
      [
        "// page-builder-generator:component-imports",
        `import ${names.pascal}, { has${names.pascal}Content } from "@/components/blocks/${file}";`,
      ],
      ["  // page-builder-generator:editing-types", `  "${names.camel}",`],
      [
        "  // page-builder-generator:component-map",
        `  ${names.camel}: ${names.pascal},`,
      ],
      [
        "  // page-builder-generator:visible-blocks",
        `  if (block._type === "${names.camel}") return has${names.pascal}Content(block);`,
      ],
    ],
  };
}

function registeredPattern(camel) {
  return new RegExp(`(?:["']${camel}["']|\\b${camel}\\s*:)`);
}

async function readRegistrations(paths) {
  return Object.fromEntries(
    await Promise.all(
      Object.entries(paths).map(async ([key, file]) => [
        key,
        await readFile(file, "utf8"),
      ]),
    ),
  );
}

export async function buildPlan(options) {
  const root = options.root ?? repoRoot;
  const paths = registrationPaths(root);
  const names = getNames(options.name, options.title);
  const file = blockFile(options, names);
  const targets = blockTargets(root, file, names);

  for (const file of [
    targets.schema,
    targets.query,
    targets.component,
    targets.preview,
  ]) {
    if (existsSync(file))
      throw new Error(`Refusing to overwrite existing file: ${file}`);
  }
  if (options.preview) {
    if (!existsSync(options.preview))
      throw new Error(`Preview not found: ${options.preview}`);
    if (![".jpg", ".jpeg"].includes(extname(options.preview).toLowerCase())) {
      throw new Error("--preview must point to a JPG image");
    }
  }

  const originals = await readRegistrations(paths);
  if (
    Object.values(originals).some((source) =>
      registeredPattern(names.camel).test(source),
    )
  )
    throw new Error(`Block is already registered: ${names.camel}`);

  const lines = registrationLines(names, file, options.scope);
  if (!options.preview) lines.blockTypes.pop();
  const registrations = Object.fromEntries(
    Object.entries(lines).map(([key, inserts]) => [
      key,
      inserts.reduce(
        (source, [marker, line]) =>
          insertAtMarker(source, marker, line, paths[key]),
        originals[key],
      ),
    ]),
  );

  return {
    names,
    originals,
    paths,
    registrations,
    targets,
    templates: {
      schema: schemaTemplate(names),
      query: queryTemplate(names),
      component: componentTemplate(names),
      ...options.templates,
    },
  };
}

/**
 * The inverse of buildPlan: the registrations without the block's lines, and
 * the block's files that exist. Throws, before anything is written, when the
 * block is not registered or a registration names it in a line the generator
 * did not write.
 */
export async function buildRemovalPlan(options) {
  const root = options.root ?? repoRoot;
  const paths = registrationPaths(root);
  const names = getNames(options.name, options.title);
  const file = blockFile(options, names);
  const targets = blockTargets(root, file, names);
  const originals = await readRegistrations(paths);
  const pattern = registeredPattern(names.camel);
  if (!Object.values(originals).some((source) => pattern.test(source))) {
    throw new Error(`Block is not registered: ${names.camel}`);
  }
  const lines = registrationLines(names, file, "content");
  const registrations = {};
  for (const [key, source] of Object.entries(originals)) {
    const remove = new Set(lines[key].map(([, line]) => line));
    const kept = source
      .split("\n")
      .filter((line) => !remove.has(line))
      .join("\n");
    if (pattern.test(kept)) {
      throw new Error(
        `${paths[key]} still names ${names.camel} after removing its generated lines. Remove it there by hand, then run again.`,
      );
    }
    registrations[key] = kept;
  }
  return {
    names,
    originals,
    paths,
    registrations,
    targets: Object.fromEntries(
      Object.entries(targets).filter(([, target]) => existsSync(target)),
    ),
  };
}

export async function applyPlan(plan, options, io = { writeFile, copyFile }) {
  const { paths } = plan;
  const created = [];
  const updated = [];
  try {
    for (const [key, file] of Object.entries(paths)) {
      if ((await readFile(file, "utf8")) !== plan.originals[key]) {
        throw new Error(
          `Registration changed while planning: ${file}. Run again.`,
        );
      }
    }
    for (const key of ["schema", "query", "component"]) {
      await mkdir(dirname(plan.targets[key]), { recursive: true });
      await io.writeFile(plan.targets[key], plan.templates[key], {
        encoding: "utf8",
        flag: "wx",
      });
      created.push([plan.targets[key], Buffer.from(plan.templates[key])]);
    }
    if (options.preview) {
      await mkdir(dirname(plan.targets.preview), { recursive: true });
      await io.copyFile(
        options.preview,
        plan.targets.preview,
        constants.COPYFILE_EXCL,
      );
      created.push([
        plan.targets.preview,
        await readFile(plan.targets.preview),
      ]);
    }
    for (const key of Object.keys(paths)) {
      if ((await readFile(paths[key], "utf8")) !== plan.originals[key]) {
        throw new Error(`Registration changed while generating: ${paths[key]}`);
      }
      updated.push(key);
      await io.writeFile(paths[key], plan.registrations[key], "utf8");
    }
  } catch (error) {
    const rollback = await Promise.allSettled(
      updated.map(async (key) => {
        if ((await readFile(paths[key], "utf8")) === plan.registrations[key]) {
          await writeFile(paths[key], plan.originals[key], "utf8");
        }
      }),
    );
    // If another writer changed a registration, keep generated files: the
    // changed registration may still refer to them.
    const restored = await Promise.all(
      Object.entries(paths).map(
        async ([key, file]) =>
          (await readFile(file, "utf8").catch(() => undefined)) ===
          plan.originals[key],
      ),
    );
    if (restored.every(Boolean)) {
      rollback.push(
        ...(await Promise.allSettled(
          created.map(async ([file, contents]) => {
            if ((await readFile(file)).equals(contents)) await rm(file);
          }),
        )),
      );
    }
    const failures = rollback.filter((result) => result.status === "rejected");
    if (failures.length)
      throw new AggregateError(
        [error, ...failures.map((result) => result.reason)],
        "Generation failed; rollback needs inspection",
        { cause: error },
      );
    throw error;
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }

  const lockPath = resolve(repoRoot, ".page-builder-generator.lock");
  let locked = false;
  try {
    if (!options.dryRun) {
      try {
        await mkdir(lockPath);
      } catch (error) {
        if (error.code === "EEXIST")
          throw new Error(
            "Another generator run holds .page-builder-generator.lock. If it crashed, remove that empty directory before retrying.",
          );
        throw error;
      }
      locked = true;
    }
    const plan = await buildPlan(options);
    const files = [
      plan.targets.schema,
      plan.targets.query,
      plan.targets.component,
    ];
    if (options.preview) files.push(plan.targets.preview);

    if (options.dryRun) {
      console.log(`Would create and register ${plan.names.camel}:`);
      for (const file of files) console.log(`- ${file}`);
      return;
    }

    await applyPlan(plan, options);
    console.log(`Created and registered ${plan.names.camel}.`);
    for (const file of files) console.log(`- ${file}`);
    console.log(
      "Next: shape the schema, query, renderer, and its content rule together, then run pnpm typegen once.",
    );
    if (!options.preview)
      console.log(
        "Studio grid preview omitted. Add a JPG when the design is ready.",
      );
  } finally {
    if (locked) await rm(lockPath, { recursive: true });
  }
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url))
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
