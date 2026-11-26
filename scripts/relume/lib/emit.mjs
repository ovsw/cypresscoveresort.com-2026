// Writes the three files of a block converted from Relume: the Studio
// schema, the GROQ projection and the React renderer.

import { isLogoImage, sampleDate as sampleDateOf } from "./model.mjs";

const json = (value) => JSON.stringify(value);

function titleCase(name) {
  const words = name.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return words[0].toUpperCase() + words.slice(1);
}

// The help on a logo image (see logoCategories in convert.mjs and
// isLogoImage in model.mjs), as on the hand-finished logo3's logos.
const logoHelp =
  "Use logos with a transparent background: on a Dark theme they are drawn in white.";

function fieldSchema(field, { required, owner, logo = false }, indent) {
  const pad = " ".repeat(indent);
  const lines = [`${pad}defineField({`, `${pad}  name: ${json(field.name)},`];
  const label = titleCase(field.name).toLowerCase();
  if (
    (logo && (field.kind === "image" || field.kind === "imageList")) ||
    isLogoImage(field)
  ) {
    lines.push(`${pad}  description: ${json(logoHelp)},`);
  }

  if (field.kind === "string") {
    lines.push(`${pad}  type: ${json(field.multiline ? "text" : "string")},`);
    if (field.multiline) lines.push(`${pad}  rows: 3,`);
    if (required) {
      lines.push(
        `${pad}  validation: (rule) =>`,
        `${pad}    requiredText(`,
        `${pad}      rule,`,
        `${pad}      ${json(`Add the ${label}. The ${owner} is not shown without it.`)},`,
        `${pad}    ),`,
      );
    }
  } else if (field.kind === "date") {
    // Relume's date in text parts, as the hand-finished event9 models it.
    const shown = field.parts
      .map((part) => (part === "monthYear" ? "month and year" : part))
      .join(", ")
      .replace(/, ([^,]*)$/, " and $1");
    lines.push(
      `${pad}  type: "date",`,
      `${pad}  description: ${json(`Shown as its ${shown}.`)},`,
      `${pad}  validation: (rule) =>`,
      `${pad}    rule.required().error(${json(`Add the ${label}. The ${owner} needs it.`)}),`,
    );
  } else if (field.kind === "link") {
    // Relume's `url` and the item's one button, as the hand-finished event9
    // models an event's page.
    lines.push(
      `${pad}  type: "button",`,
      `${pad}  description: ${json(`Where the ${owner} links, and the label of its button. Its image and title link there too.`)},`,
      `${pad}  validation: (rule) =>`,
      `${pad}    rule.required().error(${json(`Add the link. The ${owner}'s button needs it.`)}),`,
    );
  } else if (field.kind === "stringList") {
    // One required line per item, as the hand-finished pricing18 models a
    // plan's features.
    lines.push(
      `${pad}  type: "array",`,
      `${pad}  of: [`,
      `${pad}    defineArrayMember({`,
      `${pad}      type: "string",`,
      `${pad}      validation: (rule) =>`,
      `${pad}        requiredText(rule, "Write the line, or remove it."),`,
      `${pad}    }),`,
      `${pad}  ],`,
      `${pad}  validation: (rule) =>`,
      `${pad}    rule.required().min(1).error(${json(`Add at least one line to ${label}.`)}),`,
    );
  } else if (field.kind === "rating") {
    // As the hand-finished testimonial17 models its star rating.
    lines.push(
      `${pad}  type: "number",`,
      `${pad}  description: ${json(`How many stars, from 1 to 5. The ${owner} shows that many filled stars.`)},`,
      `${pad}  validation: (rule) =>`,
      `${pad}    rule`,
      `${pad}      .required()`,
      `${pad}      .integer()`,
      `${pad}      .min(1)`,
      `${pad}      .max(5)`,
      `${pad}      .error("Give a whole number of stars from 1 to 5."),`,
    );
  } else if (field.kind === "video") {
    lines.push(
      `${pad}  type: "url",`,
      `${pad}  description: videoLinkHelp,`,
      `${pad}  validation: (rule) =>`,
      `${pad}    videoLink(rule, ${json(`Add the ${label}. The ${owner}'s play button needs it.`)}),`,
    );
  } else if (field.kind === "image") {
    lines.push(
      ...imageSchemaLines(pad),
      `${pad}  validation: (rule) =>`,
      `${pad}    rule.required().assetRequired().error(${json(`Add the ${label}. The ${owner} needs it.`)}),`,
    );
  } else if (field.kind === "imageList") {
    lines.push(
      `${pad}  type: "array",`,
      `${pad}  of: [`,
      `${pad}    defineArrayMember({`,
      ...imageSchemaLines(`${pad}    `),
      `${pad}      validation: (rule) => rule.required().assetRequired(),`,
      `${pad}    }),`,
      `${pad}  ],`,
      `${pad}  validation: (rule) =>`,
      // The design places each image by its position in the list.
      field.indexed
        ? `${pad}    rule.required().length(${field.indexed}).error(${json(`Add exactly ${field.indexed} images to ${label}. The ${owner} places each one.`)}),`
        : `${pad}    rule.required().min(1).error(${json(`Add at least one image to ${label}.`)}),`,
    );
  } else if (field.kind === "buttons") {
    lines.push(
      `${pad}  type: "array",`,
      `${pad}  of: [defineArrayMember({ type: "button" })],`,
      `${pad}  validation: (rule) => rule.max(${Math.max(field.roles.length, 1)}),`,
    );
  } else if (field.kind === "list") {
    const lead = field.item.lead;
    lines.push(
      `${pad}  type: "array",`,
      `${pad}  of: [`,
      `${pad}    defineArrayMember({`,
      `${pad}      name: ${json(field.itemName)},`,
      `${pad}      type: "object",`,
      `${pad}      fields: [`,
      ...field.item.fields.flatMap((member) =>
        fieldSchema(
          member,
          {
            logo,
            owner: "item",
            required:
              member === lead ||
              member.kind === "image" ||
              member.kind === "video",
          },
          indent + 8,
        ),
      ),
      `${pad}      ],`,
      ...(lead
        ? [`${pad}      preview: { select: { title: ${json(lead.name)} } },`]
        : []),
      `${pad}    }),`,
      `${pad}  ],`,
      `${pad}  validation: (rule) =>`,
      `${pad}    rule.required().min(1).error(${json(`Add at least one item to ${label}.`)}),`,
    );
  } else if (field.kind === "object") {
    lines.push(
      `${pad}  type: "object",`,
      `${pad}  fields: [`,
      ...field.item.fields.flatMap((member) =>
        fieldSchema(
          member,
          { logo, owner, required: member === field.item.lead },
          indent + 4,
        ),
      ),
      `${pad}  ],`,
      // Studio checks the members of an object only when the object is set,
      // so an object that holds a required member is required itself:
      // without it the block would draw the member's place empty.
      ...(field.item.lead ||
      field.item.fields.some((member) => ["image", "video"].includes(member.kind))
        ? [
            `${pad}  validation: (rule) =>`,
            `${pad}    rule.required().error(${json(`Add the ${label}. The ${owner} needs it.`)}),`,
          ]
        : []),
    );
  }
  lines.push(`${pad}}),`);
  return lines;
}

function imageSchemaLines(pad) {
  return [
    `${pad}  type: "image",`,
    `${pad}  options: { hotspot: true },`,
    `${pad}  fields: [`,
    `${pad}    defineField({`,
    `${pad}      name: "alt",`,
    `${pad}      type: "string",`,
    `${pad}      title: "Alt Text",`,
    `${pad}      description:`,
    `${pad}        "Describe the image for screen readers. Leave empty if the image is decorative or repeats nearby text.",`,
    `${pad}    }),`,
    `${pad}  ],`,
  ];
}

// A sample star rating Studio accepts: a whole number from 1 to 5.
const isStarCount = (value) =>
  Number.isInteger(value) && value >= 1 && value <= 5;

// Sample content, so a newly inserted block shows its shape. Images and
// buttons have no sample: an editor must choose them.
function initialValue(fields) {
  const value = {};
  for (const field of fields) {
    if (field.kind === "string" && field.sample)
      value[field.name] = field.sample;
    if (field.kind === "rating" && isStarCount(field.sample))
      value[field.name] = field.sample;
    if (field.kind === "stringList" && field.samples.length)
      value[field.name] = field.samples;
    if (field.kind === "date" && field.sample) value[field.name] = field.sample;
    if (field.kind === "list") {
      value[field.name] = field.samples.map((sample, index) => ({
        _key: `${field.itemName}-${index + 1}`,
        _type: field.itemName,
        ...Object.fromEntries([
          ...field.item.fields
            .filter(
              (member) =>
                (member.kind === "string" &&
                  typeof sample[member.sourceName] === "string") ||
                (member.kind === "rating" &&
                  isStarCount(sample[member.sourceName])) ||
                (member.kind === "stringList" &&
                  Array.isArray(sample[member.sourceName])),
            )
            .map((member) => [member.name, sample[member.sourceName]]),
          ...field.item.fields
            .filter((member) => member.kind === "date")
            .flatMap((member) => {
              const date = sampleDateOf(sample[member.sourceName]);
              return date ? [[member.name, date]] : [];
            }),
        ]),
      }));
    }
    if (field.kind === "object") {
      const nested = initialValue(field.item.fields);
      if (Object.keys(nested).length) value[field.name] = nested;
    }
  }
  return value;
}

export function schemaTemplate({ names, model, entry, isLogoSection = false }) {
  const flat = (fields) =>
    fields.flatMap((field) => [
      field,
      ...(field.item ? flat(field.item.fields) : []),
    ]);
  const usesArray = flat(model.fields).some((field) =>
    ["buttons", "imageList", "list", "stringList"].includes(field.kind),
  );
  const usesRequiredText = flat(model.fields).some((field) =>
    ["string", "stringList"].includes(field.kind),
  );
  const usesVideo = flat(model.fields).some((field) => field.kind === "video");
  const imports = [
    `import { ${usesArray ? "defineArrayMember, " : ""}defineField, defineType } from "sanity";`,
    'import blockTheme from "../shared/block-theme";',
    ...(usesRequiredText
      ? ['import { requiredText } from "../../validation/required-text";']
      : []),
    ...(usesVideo
      ? ['import { videoLink, videoLinkHelp } from "../../validation/video-link";']
      : []),
  ];
  const initial = json(initialValue(model.fields));
  const fields = model.fields.flatMap((field) =>
    fieldSchema(
      field,
      {
        logo: isLogoSection,
        owner: "block",
        required:
          field === model.lead ||
          field.kind === "image" ||
          field.kind === "video",
      },
      4,
    ),
  );
  return `// Generated by \`pnpm relume:convert ${entry.slug}\` from relume/source/${entry.slug}.tsx.
${imports.join("\n")}

export default defineType({
  name: ${json(names.camel)},
  title: ${json(entry.name)},
  type: "object",
  description: ${json(entry.description)},
  initialValue: ${initial},
  fields: [
    blockTheme,
${fields.join("\n")}
  ],
  preview: {
    select: { title: ${json(model.lead.name)} },
    prepare: ({ title }) => ({
      title: title || ${json(`Untitled ${entry.name}`)},
      subtitle: ${json(entry.name)},
    }),
  },
});
`;
}

function fieldProjection(field, indent) {
  const pad = " ".repeat(indent);
  if (["string", "video", "rating", "stringList", "date"].includes(field.kind)) {
    return [`${pad}${field.name}`];
  }
  if (field.kind === "image") {
    return [`${pad}${field.name} {`, `${pad}  \${imageQuery}`, `${pad}}`];
  }
  if (field.kind === "imageList") {
    return [
      `${pad}${field.name}[]{`,
      `${pad}  _key,`,
      `${pad}  \${imageQuery}`,
      `${pad}}`,
    ];
  }
  if (field.kind === "buttons") {
    return [`${pad}${field.name}[]{`, `${pad}  \${buttonQuery}`, `${pad}}`];
  }
  if (field.kind === "link") {
    return [`${pad}${field.name} {`, `${pad}  \${buttonQuery}`, `${pad}}`];
  }
  const members = field.item.fields.map((member) =>
    fieldProjection(member, indent + 2),
  );
  const open =
    field.kind === "list" ? `${pad}${field.name}[]{` : `${pad}${field.name} {`;
  const first = field.kind === "list" ? [[`${pad}  _key`]] : [];
  return [open, joinProjections([...first, ...members]), `${pad}}`];
}

function joinProjections(groups) {
  return groups
    .map((lines, index) =>
      index === groups.length - 1 ? lines.join("\n") : `${lines.join("\n")},`,
    )
    .join("\n");
}

export function queryTemplate({ names, model, entry }) {
  const flat = (fields) =>
    fields.flatMap((field) => [
      field,
      ...(field.item ? flat(field.item.fields) : []),
    ]);
  const all = flat(model.fields);
  const imports = ['import { groq } from "next-sanity";'];
  if (all.some((field) => ["buttons", "link"].includes(field.kind))) {
    imports.push('import { buttonQuery } from "../shared/button";');
  }
  if (
    all.some((field) => field.kind === "image" || field.kind === "imageList")
  ) {
    imports.push('import { imageQuery } from "../shared/image";');
  }
  const projections = [
    ["    theme"],
    ...model.fields.map((field) => fieldProjection(field, 4)),
  ];
  return `// Generated by \`pnpm relume:convert ${entry.slug}\` from relume/source/${entry.slug}.tsx.
${imports.join("\n")}

// @sanity-typegen-ignore
export const ${names.camel}Query = groq\`
  _type == "${names.camel}" => {
${joinProjections(projections)}
  }
\`;
`;
}

const usesName = (code, name) => new RegExp(`\\b${name}\\b`).test(code);

// The type aliases of the Relume source that the carried code names.
// `ImageProps` becomes the Starter's image value.
function carriedAliases(model, code) {
  const skipped = new Set(["Props", "ButtonProps", "ImageProps"]);
  const carried = new Map();
  let text = code;
  for (let grew = true; grew;) {
    grew = false;
    for (const [name, source] of model.aliasText ?? []) {
      if (skipped.has(name) || carried.has(name)) continue;
      if (!usesName(text, name)) continue;
      carried.set(name, source);
      text += `\n${source}`;
      grew = true;
    }
  }
  const lines = [...carried.values()];
  if (usesName(text, "ImageProps")) {
    lines.unshift("type ImageProps = BlockImageValue;");
  }
  return lines;
}

function blockParts({ names, model, rendered }) {
  const { uses } = rendered;
  const lead = model.lead.name;
  const roles = (rendered.buttonRoles ?? [])
    .map(
      (role) =>
        `// A button's style comes from its position, as in the Relume original.\nconst ${role.name}: BlockButtonRole[] = ${role.code};\n`,
    )
    .join("\n");
  const helpers = (rendered.helpers ?? []).join("\n\n");
  const statements = (rendered.statements ?? []).join("\n");
  // A hero's heading levels: the page's <h1> when the hero leads the page.
  const headingTags = Array.from(
    { length: uses.heroHeadingLevels },
    (_, index) =>
      `const Heading${index + 1} = leadsPage ? "h${index + 1}" : "h${index + 2}";\n`,
  );
  const headingId = [
    ...headingTags,
    ...(uses.headingId
      ? [`const headingId = \`${names.kebab}-\${stegaClean(_key)}-${lead}\`;\n`]
      : []),
  ].join("  ");
  const code = [roles, helpers, statements, rendered.jsx].join("\n");
  const aliases = carriedAliases(model, code);
  const propNames = [
    "_key",
    'bottom = "outer"',
    model.client ? "editing" : "dataAttribute",
    ...model.fields.map((field) => field.name),
    ...(uses.heroHeadingLevels ? ["leadsPage = false"] : []),
    "theme",
    'top = "outer"',
  ];
  if (!uses.headingId) propNames.shift();

  const imports = [];
  if (uses.buttons) {
    imports.push(
      'import {\n  BlockButtons,\n  type BlockButtonRole,\n} from "@/components/blocks/relume/block-buttons";',
    );
  }
  if (model.client) {
    imports.push(
      'import { blockDataAttribute } from "@/components/blocks/relume/block-editing";',
    );
  }
  const imageNames = [
    ...(uses.image ? ["BlockImage"] : []),
    ...(uses.logo ? ["blockLogoClassName"] : []),
    ...(aliases[0]?.startsWith("type ImageProps")
      ? ["type BlockImageValue"]
      : []),
  ];
  if (imageNames.length) {
    imports.push(
      `import { ${imageNames.join(", ")} } from "@/components/blocks/relume/block-image";`,
    );
  }
  if (uses.accordion?.size) {
    imports.push(
      `import { ${[...uses.accordion].sort().join(", ")} } from "@/components/blocks/relume/block-accordion";`,
    );
  }
  if (uses.tabs?.size) {
    imports.push(
      `import { ${[...uses.tabs].sort().join(", ")} } from "@/components/blocks/relume/block-tabs";`,
    );
  }
  if (uses.link || uses.linkButton) {
    const names = [
      ...(uses.link ? ["BlockLink"] : []),
      ...(uses.linkButton ? ["BlockLinkButton"] : []),
    ];
    imports.push(
      `import { ${names.join(", ")} } from "@/components/blocks/relume/block-link";`,
    );
    if (!uses.buttons && uses.linkButton) {
      imports.push(
        'import { type BlockButtonRole } from "@/components/blocks/relume/block-buttons";',
      );
    }
  }
  if (uses.date) {
    imports.push(
      'import { blockDatePart } from "@/components/blocks/relume/block-date";',
    );
  }
  if (uses.stars) {
    imports.push(
      'import { BlockStars } from "@/components/blocks/relume/block-stars";',
    );
  }
  if (uses.video) {
    imports.push(
      'import { BlockVideoDialog } from "@/components/blocks/relume/block-video-dialog";',
    );
  }
  if (uses.cn) imports.push('import { cn } from "@/lib/utils";');
  return {
    aliases,
    code,
    headingId,
    helpers,
    imports,
    lead,
    propNames,
    roles,
    statements,
  };
}

const pageBlockType = `type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];`;

const generatedHeader = (entry, what = "") =>
  `// Generated by \`pnpm relume:convert ${entry.slug}\` from relume/source/${entry.slug}.tsx
// (Relume ${entry.name})${what}. Regenerate instead of editing by hand, unless the
// file is listed under "Hand-finished blocks" in docs/agents/relume-import.md.`;

/**
 * The renderer. A block that runs in the browser (hooks, Motion) is two
 * files: this server entry, which holds the content rule the Page Builder
 * calls, and the Client Component from `clientComponentTemplate`.
 */
export function componentTemplate(context) {
  const { names, model, entry, rendered } = context;
  if (model.client) return clientEntryTemplate(context);
  const { uses } = rendered;
  const parts = blockParts(context);
  const { lead } = parts;
  const imports = [...parts.imports];
  if (model.browserImports?.clsx && usesName(parts.code, "clsx")) {
    imports.push('import clsx from "clsx";');
  }
  imports.push(
    'import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";',
  );
  if (uses.lucide.size) {
    imports.push(
      `import { ${[...uses.lucide].sort().join(", ")} } from "lucide-react";`,
    );
  }
  imports.push(
    'import { stegaClean } from "next-sanity";',
    'import {\n  resolveBlockTheme,\n  blockSceneClassName,\n  type BlockSceneProps,\n} from "../block-boundaries";',
  );
  const before = [parts.aliases.join("\n\n"), parts.roles, parts.helpers]
    .filter(Boolean)
    .join("\n\n");

  return `${generatedHeader(entry)}
${imports.join("\n")}

${pageBlockType}

type ${names.pascal}Block = Extract<PageBlock, { _type: "${names.camel}" }>;

type ${names.pascal}Props = ${names.pascal}Block & {
  dataAttribute?: (path: string) => string | undefined;
} & BlockSceneProps;
${before ? `\n${before}\n` : ""}
// The Page Builder excludes blocks without content from visible adjacency.
// Keep this rule aligned with the renderer's empty result below.
export function has${names.pascal}Content(
  block: Pick<${names.pascal}Block, ${json(lead)}>,
) {
  return Boolean(stegaClean(block.${lead})?.trim());
}

export default function ${names.pascal}({
  ${parts.propNames.join(",\n  ")},
}: ${names.pascal}Props) {
  if (!has${names.pascal}Content({ ${lead} })) return null;
${parts.headingId ? `\n  ${parts.headingId}` : ""}
  return (
    ${rendered.jsx}
  );
}
`;
}

function clientEntryTemplate(context) {
  const { names, entry } = context;
  const { lead, propNames } = blockParts(context);
  const passed = [
    ...new Set(["_key", ...propNames.map((name) => name.split(" ")[0])]),
  ];
  return `${generatedHeader(entry, ", server half")}
import type { BlockEditing } from "@/components/blocks/relume/block-editing";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { stegaClean } from "next-sanity";
import type { BlockSceneProps } from "../block-boundaries";
import ${names.pascal}Client from "./${entry.slug}.client";

${pageBlockType}

type ${names.pascal}Block = Extract<PageBlock, { _type: "${names.camel}" }>;

export type ${names.pascal}Props = ${names.pascal}Block & {
  editing?: BlockEditing;
} & BlockSceneProps;

// The Page Builder excludes blocks without content from visible adjacency.
// Keep this rule aligned with the renderer's empty result below.
export function has${names.pascal}Content(
  block: Pick<${names.pascal}Block, ${json(lead)}>,
) {
  return Boolean(stegaClean(block.${lead})?.trim());
}

// The block runs in the browser, so it is drawn by a Client Component.
// This entry stays on the server for the content rule above, and passes on
// only what can cross to the browser: \`editing\` in place of the
// \`dataAttribute\` function.
export default function ${names.pascal}({
  ${passed.join(",\n  ")},
}: ${names.pascal}Props) {
  if (!has${names.pascal}Content({ ${lead} })) return null;

  return (
    <${names.pascal}Client
      ${passed.map((name) => `${name}={${name}}`).join("\n      ")}
    />
  );
}
`;
}

/** The browser half of a block with hooks or Motion; undefined otherwise. */
export function clientComponentTemplate(context) {
  const { names, model, entry, rendered } = context;
  if (!model.client) return undefined;
  const { uses } = rendered;
  const parts = blockParts(context);
  const code = `${parts.code}\n${parts.aliases.join("\n")}\n${parts.headingId}`;
  const named = (bindings) =>
    bindings
      .filter(({ name }) => usesName(code, name))
      .map(({ name, typeOnly }) => (typeOnly ? `type ${name}` : name));

  const imports = [...parts.imports];
  if (model.browserImports.clsx && usesName(code, "clsx")) {
    imports.push('import clsx from "clsx";');
  }
  if (uses.lucide.size) {
    imports.push(
      `import { ${[...uses.lucide].sort().join(", ")} } from "lucide-react";`,
    );
  }
  // MotionConfig makes Motion skip movement for a visitor who asked for
  // reduced motion.
  const motion = [
    ...new Set([
      ...(uses.motion ? ["MotionConfig"] : []),
      ...named(model.browserImports.motion),
    ]),
  ].sort();
  if (motion.length) {
    imports.push(`import { ${motion.join(", ")} } from "motion/react";`);
  }
  if (usesName(code, "stegaClean")) {
    imports.push('import { stegaClean } from "next-sanity";');
  }
  if (model.browserImports.mediaQuery && usesName(code, "useMediaQuery")) {
    imports.push('import { useMediaQuery } from "@/hooks/use-media-query";');
  }
  const react = [...new Set(named(model.browserImports.react))].sort();
  if (react.length)
    imports.push(`import { ${react.join(", ")} } from "react";`);
  imports.push(
    'import {\n  resolveBlockTheme,\n  blockSceneClassName,\n} from "../block-boundaries";',
    `import type { ${names.pascal}Props } from "./${entry.slug}";`,
  );
  const before = [parts.aliases.join("\n\n"), parts.roles, parts.helpers]
    .filter(Boolean)
    .join("\n\n");
  const jsx = uses.motion
    ? `<MotionConfig reducedMotion="user">${rendered.jsx}</MotionConfig>`
    : rendered.jsx;

  return `"use client";

${generatedHeader(entry, ", browser half")}
${imports.join("\n")}
${before ? `\n${before}\n` : ""}
export default function ${names.pascal}Client({
  ${parts.propNames.join(",\n  ")},
}: Omit<${names.pascal}Props, "_type">) {
  const dataAttribute = blockDataAttribute(editing);
  ${parts.headingId}${parts.statements}

  return (
    ${jsx}
  );
}
`;
}

const fieldPhrase = (field) => {
  if (field.kind === "buttons") {
    return `up to ${Math.max(field.roles.length, 1)} button${field.roles.length === 1 ? "" : "s"}`;
  }
  if (field.kind === "imageList") {
    return `${titleCase(field.name).toLowerCase()} (${field.indexed ? `exactly ${field.indexed} images` : "images"})`;
  }
  if (field.kind === "rating") {
    return `${titleCase(field.name).toLowerCase()} (1 to 5 stars)`;
  }
  if (field.kind === "stringList") {
    return `${titleCase(field.name).toLowerCase()} (lines of text)`;
  }
  if (field.kind === "link") {
    return "link (a button; the image and title link there too)";
  }
  if (field.kind === "date") {
    return `${titleCase(field.name).toLowerCase()} (a date)`;
  }
  if (field.kind === "video") {
    return `${titleCase(field.name).toLowerCase()} (a YouTube or Vimeo link, played in a pop-up)`;
  }
  if (field.kind === "list") {
    const members = field.item.fields.map((member) =>
      titleCase(member.name).toLowerCase(),
    );
    return `${titleCase(field.name).toLowerCase()} (each: ${members.join(", ")})`;
  }
  return titleCase(field.name).toLowerCase();
};

/** The block's line in the "Block library" list of docs/content-model.md. */
export function libraryEntry({ names, model, entry }) {
  const fields = model.fields.map(fieldPhrase).join(", ");
  return `- \`${names.camel}\` (${entry.name}). ${entry.description} Fields: ${fields}. Available on every page.`;
}

// The Starter's seed images are Relume's placeholders (see STARTER_ASSETS in
// studio/scripts/seed.mjs). In a block whose images move, they are numbered
// 1 to 4 in drawing order, so the motion reads at a glance.
const imageKind = (field) =>
  /avatar|portrait|person|author/i.test(field.name)
    ? "avatar"
    : isLogoImage(field) || /icon/i.test(field.name)
      ? "logo"
      : "picture";

const seedImage = (field, numbering) => {
  const kind = imageKind(field);
  if (kind !== "picture") return kind;
  if (!numbering) return "landscape";
  numbering.count += 1;
  return `numbered-${((numbering.count - 1) % 4) + 1}`;
};

/** How many pictures (not avatars or logos) the block's sample draws. */
function pictureCount(fields, sample) {
  let count = 0;
  for (const field of fields) {
    const value = sample?.[field.sourceName];
    if (field.kind === "image" && imageKind(field) === "picture") count += 1;
    else if (field.kind === "imageList" && imageKind(field) === "picture")
      count +=
        field.indexed ??
        (Array.isArray(value) && value.length ? value.length : 1);
    else if (field.kind === "list")
      for (const item of Array.isArray(value) ? value : [])
        count += pictureCount(field.item.fields, item);
    else if (field.kind === "object")
      count += pictureCount(field.item.fields, value);
  }
  return count;
}

function seedValue(fields, sample, key, numbering) {
  const lines = [];
  for (const field of fields) {
    const value = sample?.[field.sourceName];
    if (field.kind === "string" && typeof value === "string") {
      lines.push(`${field.name}: ${json(value)},`);
    } else if (field.kind === "video" && typeof value === "string") {
      lines.push(`${field.name}: ${json(value)},`);
    } else if (field.kind === "date") {
      // Studio requires the date; Relume's sample when it makes one.
      lines.push(`${field.name}: ${json(sampleDateOf(value) ?? "2026-01-01")},`);
    } else if (field.kind === "link") {
      // The shared button object, without the key a list item has.
      lines.push(
        `${field.name}: { ...button(${json(`${key}-${field.name}`)}, ${json(value?.title || "Button")}), _key: undefined },`,
      );
    } else if (field.kind === "stringList" && Array.isArray(value)) {
      lines.push(`${field.name}: ${json(value.filter((line) => typeof line === "string"))},`);
    } else if (field.kind === "rating") {
      // Studio requires a rating; Relume's sample when it is one Studio takes.
      lines.push(`${field.name}: ${isStarCount(value) ? value : 5},`);
    } else if (field.kind === "image") {
      lines.push(`${field.name}: image(${json(seedImage(field, numbering))}),`);
    } else if (field.kind === "imageList") {
      const count =
        field.indexed ??
        (Array.isArray(value) && value.length ? value.length : 1);
      const items = Array.from(
        { length: count },
        (_, index) =>
          `{ _key: ${json(`${key}-${field.name}-${index + 1}`)}, ...image(${json(seedImage(field, numbering))}) },`,
      );
      lines.push(`${field.name}: [`, ...items, "],");
    } else if (field.kind === "buttons") {
      const items = field.roles.map(
        (_, index) =>
          `button(${json(`${key}-${field.name}-${index + 1}`)}, "Button"),`,
      );
      lines.push(`${field.name}: [`, ...items, "],");
    } else if (field.kind === "list") {
      const samples = Array.isArray(value) ? value : [];
      lines.push(`${field.name}: [`);
      samples.forEach((item, index) => {
        const itemKey = `${key}-${field.itemName}-${index + 1}`;
        lines.push(
          "{",
          `_key: ${json(itemKey)},`,
          `_type: ${json(field.itemName)},`,
          ...seedValue(field.item.fields, item, itemKey, numbering),
          "},",
        );
      });
      lines.push("],");
    } else if (field.kind === "object") {
      lines.push(
        `${field.name}: {`,
        ...seedValue(field.item.fields, value, key, numbering),
        "},",
      );
    }
  }
  return lines;
}

/** The block's sample content for studio/scripts/seed-relume-blocks.mjs. */
export function seedBlock({ entry, names, model }) {
  const numbering =
    model.moving && pictureCount(model.fields, model.defaults) > 1
      ? { count: 0 }
      : undefined;
  // Relume repeats its sample headings ("Medium length section heading goes
  // here"), and a block's <section> is named by its heading, so on the Block
  // library page the heading starts with the block's name to keep each
  // region's name unique.
  const lead = model.lead;
  const sample =
    lead &&
    ["heading", "title"].includes(lead.name) &&
    typeof model.defaults?.[lead.sourceName] === "string"
      ? {
          ...model.defaults,
          [lead.sourceName]: `${entry.name}: ${model.defaults[lead.sourceName]}`,
        }
      : model.defaults;
  return [
    "{",
    `_key: ${json(names.kebab)},`,
    `_type: ${json(names.camel)},`,
    'theme: "light",',
    ...seedValue(model.fields, sample, names.kebab, numbering),
    "},",
  ].join("\n");
}
