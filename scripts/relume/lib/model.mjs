// Reads a Relume component source and builds the content model the Sanity
// schema, the GROQ projection and the renderer are generated from.

import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const requireFromFrontend = createRequire(
  resolve(repoRoot, "frontend/package.json"),
);
export const ts = requireFromFrontend("typescript");

/** A converter stop: the component needs a person's or an agent's judgment. */
export class NeedsJudgment extends Error {
  constructor(reasons) {
    super(
      `Needs judgment:\n${reasons.map((reason) => `- ${reason}`).join("\n")}`,
    );
    this.reasons = reasons;
  }
}

// A plain string cannot say that it holds one of these. The converter stops
// instead of making a text field for them.
const nonTextNames =
  /^(video|videoType|videoUrl|url|href|link|src|icon|logo|embed|date|price)$/i;

// The Starter forbids field names that read as a design switch (see "One
// block, one design" in docs/agents/page-builder.md). A Relume content
// field with such a name gets a clearer one.
// "data" says nothing to an editor: Relume uses it for the list of features
// in a feature section (Layout 420's pinned panels).
// The sample of a video that plays in a pop-up: the address of a YouTube or
// Vimeo player, which Relume puts in an <iframe> inside a Dialog. The field
// becomes a link an editor pastes (see "Video pop-ups" in
// docs/agents/relume-import.md). A video file (`placeholder-video.mp4`,
// Layout 355's background video) is not one.
const videoPlayerSample =
  /^https?:\/\/((www\.)?youtube(-nocookie)?\.com\/embed\/|player\.vimeo\.com\/video\/)/;

// "trigger" is the label of a tab (Layout 505's `tabs[].trigger`).
const renamedFields = {
  position: "jobTitle",
  data: "features",
  trigger: "label",
};
const designWords =
  /^(layout|variant|style|design|look|appearance|position|align|alignment|column|reverse|reversed|orientation)s?$/;
const readsAsDesignSwitch = (name) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[\s_-]+/)
    .some((word) => designWords.test(word));

// React hooks a block may keep. A hook outside this list needs a look.
const reactHooks = new Set([
  "useCallback",
  "useEffect",
  "useId",
  "useLayoutEffect",
  "useMemo",
  "useRef",
  "useState",
]);

// The first string field with one of these names is the field the block
// cannot be drawn without. Order is preference.
const leadFieldNames = ["heading", "title", "name", "question", "quote"];

export function parseSource(source, fileName = "component.tsx") {
  return ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
}

// `values` holds the values declared beside the component, by name: a
// sample may name one (`cards: [card, card, card]` in Layout 520).
function literalValue(node, values = new Map(), seen = new Set()) {
  if (ts.isIdentifier(node) && values.has(node.text) && !seen.has(node.text)) {
    return literalValue(
      values.get(node.text),
      values,
      new Set([...seen, node.text]),
    );
  }
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map((element) => literalValue(element, values, seen));
  }
  if (ts.isObjectLiteralExpression(node)) {
    return Object.fromEntries(
      node.properties.flatMap((property) =>
        ts.isPropertyAssignment(property)
          ? [
              [
                property.name.getText(),
                literalValue(property.initializer, values, seen),
              ],
            ]
          : [],
      ),
    );
  }
  if (ts.isParenthesizedExpression(node)) {
    return literalValue(node.expression, values, seen);
  }
  // JSX and identifiers stay as source text for the renderer to place.
  return { __source: node.getText() };
}

/**
 * Whether an image field holds a logo outside a logo section: its name says
 * so (`logo`, `companyLogo`), or Relume's sample is a logo file
 * (`webflow-logo.svg`, in Testimonial 2's field named `image`).
 */
export function isLogoImage(field) {
  if (field?.kind !== "image" && field?.kind !== "imageList") return false;
  const fileName = (field.sample ?? "").split(/[?#]/)[0].split("/").at(-1);
  return /logo/i.test(field.name) || /logo/i.test(fileName);
}

function leadField(fields) {
  const strings = fields.filter((field) => field.kind === "string");
  return (
    leadFieldNames
      .map((name) => strings.find((field) => field.name === name))
      .find(Boolean) ?? strings[0]
  );
}

function singular(name) {
  if (name.endsWith("ies")) return `${name.slice(0, -3)}y`;
  if (name.endsWith("s") && !name.endsWith("ss")) return name.slice(0, -1);
  return `${name}Item`;
}

/**
 * Builds the field list of one type literal.
 * `defaults` is the matching value from the component's Defaults object.
 */
function buildFields(typeLiteral, aliases, defaults, path, reasons, options = {}) {
  const fields = [];
  for (const member of typeLiteral.members) {
    if (!ts.isPropertySignature(member) || !member.type) continue;
    const sourceName = member.name.getText();
    const name = renamedFields[sourceName] ?? sourceName;
    const where = [...path, sourceName].join(".");
    const value = defaults?.[sourceName];
    if (readsAsDesignSwitch(name)) {
      reasons.push(
        `"${where}" reads as a design switch, which a block may not have. Give it a content name in renamedFields, or leave the field out by hand.`,
      );
      continue;
    }
    const type = member.type;
    const isArray = ts.isArrayTypeNode(type);
    const inner = isArray ? type.elementType : type;
    const reference = ts.isTypeReferenceNode(inner)
      ? inner.typeName.getText()
      : undefined;

    // In a block with tabs, a tab's `value` is the id Radix matches a tab to
    // its panel by, and `defaultTabValue` names the tab that opens first.
    // Neither is content: an item's `_key` is its id, and the first tab
    // opens first (render.mjs).
    if (
      options.tabs &&
      inner.kind === ts.SyntaxKind.StringKeyword &&
      !isArray &&
      (path.length
        ? // Directly in a list item (`tabs[]`), not in an object inside it.
          sourceName === "value" && path.at(-1).endsWith("[]")
        : /^default(Tab)?Value$/.test(sourceName))
    ) {
      if (path.length) fields.tabValue = true;
      continue;
    }
    if (inner.kind === ts.SyntaxKind.StringKeyword && !isArray) {
      // A name the list above misses still gives itself away by its sample:
      // Header 104's "bgUrl" holds the address of a photo.
      const holdsAddress = typeof value === "string" && /^https?:\/\//.test(value);
      if (typeof value === "string" && videoPlayerSample.test(value)) {
        fields.push({ kind: "video", name, sourceName, sample: value });
        continue;
      }
      if (nonTextNames.test(name) || /(Url|Href|Src)$/.test(name) || holdsAddress) {
        reasons.push(
          `"${where}" is a string that holds something other than text (a link, a video, an icon). Model it by hand.`,
        );
        continue;
      }
      const sample = typeof value === "string" ? value : "";
      fields.push({
        kind: "string",
        name,
        sourceName,
        multiline: sample.length > 100,
        sample,
      });
      continue;
    }
    // An image or an object marked optional (`image?: ImageProps` beside
    // `video?: VideoProps` in Layout 499's tabs) is one of several things an
    // item may hold in the same place. A generated block would ask for all
    // of them and draw them one under the other.
    if (
      member.questionToken &&
      !isArray &&
      (reference === "ImageProps" ||
        (reference && ts.isTypeLiteralNode(aliases.get(reference) ?? member)))
    ) {
      reasons.push(
        `"${where}" is optional: the component draws it only when it is set, in place of something else. Decide by hand what an item may hold.`,
      );
      continue;
    }
    if (reference === "ImageProps") {
      // The address of Relume's sample image (its first, for a list).
      const image = isArray && Array.isArray(value) ? value[0] : value;
      fields.push({
        kind: isArray ? "imageList" : "image",
        name,
        sourceName,
        sample: typeof image?.src === "string" ? image.src : "",
      });
      continue;
    }
    if (reference === "ButtonProps") {
      const buttons = isArray ? value : value ? [value] : [];
      // A single button (`button: ButtonProps`) is a buttons array of at
      // most one, as the hand-finished faq3 models its contact button:
      // `button` becomes `buttons`, `articleButton` `articleButtons`.
      fields.push({
        kind: "buttons",
        name: isArray ? name : `${name}s`,
        single: !isArray,
        sourceName,
        roles: (Array.isArray(buttons) && buttons.length
          ? buttons
          : isArray
            ? []
            : // A single button always has its one role, sample or not.
              [{}]
        ).map((button) => ({
          iconRight: button.iconRight?.__source,
          iconLeft: button.iconLeft?.__source,
          size: button.size,
          variant: button.variant ?? "primary",
        })),
      });
      continue;
    }
    const alias = reference ? aliases.get(reference) : undefined;
    if (alias && ts.isTypeLiteralNode(alias)) {
      const sample = isArray ? (Array.isArray(value) ? value : []) : value;
      const itemFields = buildFields(
        alias,
        aliases,
        // An item's sample: the first item that has each member (only some
        // of Layout 499's tabs hold a video).
        isArray ? Object.assign({}, ...[...sample].reverse()) : sample,
        [...path, isArray ? `${name}[]` : name],
        reasons,
        options,
      );
      const item = {
        fields: itemFields,
        lead: leadField(itemFields),
        tabValue: Boolean(itemFields.tabValue),
      };
      fields.push(
        isArray
          ? {
              kind: "list",
              name,
              sourceName,
              itemName: singular(name),
              item,
              samples: sample,
            }
          : { kind: "object", name, sourceName, item, sample },
      );
      continue;
    }
    reasons.push(
      `"${where}" has the type ${type.getText()}, which the converter cannot model.`,
    );
  }
  // A field renamed to the name of a field the component already has: a
  // single button (`button` beside `buttons`), or a renamed field (`data`
  // beside `features`). The block would declare that name twice.
  for (const [index, field] of fields.entries()) {
    const other = fields.find(
      (candidate, position) =>
        candidate !== field &&
        candidate.name === field.name &&
        // Each pair is reported once, from the field that was renamed.
        (field.sourceName !== field.name ||
          (candidate.sourceName === candidate.name && position < index)),
    );
    if (!other) continue;
    reasons.push(
      field.single
        ? `"${[...path, field.sourceName].join(".")}" is a single button beside a "${field.name}" field. Model it by hand.`
        : `"${[...path, field.sourceName].join(".")}" and "${[...path, other.sourceName].join(".")}" would both be the field "${field.name}". Model them by hand.`,
    );
  }
  // A strip of photos that Relume numbers one by one (Header 77's "image1"
  // to "image12") is one list to an editor, and in a looping strip half of
  // them only repeat the other half so the loop has no seam.
  const numbered = fields.filter(
    (field) => field.kind === "image" && /^image\d+$/.test(field.name),
  );
  if (numbered.length > 4) {
    reasons.push(
      `"${[...path, numbered[0].sourceName].join(".")}" to "${numbered.at(-1).sourceName}" are ${numbered.length} images numbered one by one. Model them by hand as one list, without the repeats a looping strip needs.`,
    );
  }
  return fields;
}

export function analyse(source, { category } = {}) {
  const sourceFile = parseSource(source);
  const reasons = [];
  const aliases = new Map();
  const components = [];
  let defaultsName;
  let defaultsNode;
  const iconImports = [];
  const aliasText = new Map();
  // What the generated client file may import again: React hooks, Motion,
  // and clsx. Anything else the Starter does not have.
  const browserImports = { clsx: false, motion: [], react: [] };
  // Values declared beside the components, by name.
  const moduleValues = new Set();
  const moduleInitializers = new Map();
  // Whether the component imports Relume's Dialog.
  let dialog = false;
  // Whether the component imports Relume's Tabs.
  let tabs = false;
  // The names the component imports from Relume's Card.
  const cards = [];

  for (const statement of sourceFile.statements) {
    if (ts.isTypeAliasDeclaration(statement)) {
      aliases.set(statement.name.text, statement.type);
      aliasText.set(
        statement.name.text,
        statement.getText().replace(/^export\s+/, ""),
      );
    }
    if (ts.isImportDeclaration(statement)) {
      const module = statement.moduleSpecifier.text;
      const bindings = statement.importClause?.namedBindings;
      const named =
        bindings && ts.isNamedImports(bindings)
          ? bindings.elements.map((element) => ({
              name: element.name.text,
              typeOnly: element.isTypeOnly,
            }))
          : [];
      // The generated file imports each name again as written, so a renamed
      // import (`useScroll as usePageScroll`) would lose its binding.
      for (const element of bindings && ts.isNamedImports(bindings)
        ? bindings.elements
        : []) {
        if (element.propertyName) {
          reasons.push(
            `The component imports "${element.propertyName.text}" from "${module}" under another name (${element.name.text}). Carry it over by hand.`,
          );
        }
      }
      if (module === "relume-icons") {
        iconImports.push(...named.map((binding) => binding.name));
      } else if (module === "motion/react" || module === "framer-motion") {
        browserImports.motion.push(...named);
      } else if (module === "react") {
        for (const binding of named) {
          if (binding.typeOnly || reactHooks.has(binding.name)) {
            browserImports.react.push(binding);
          } else {
            reasons.push(
              `The component imports "${binding.name}" from React, which the converter does not carry over yet.`,
            );
          }
        }
      } else if (module === "clsx") {
        browserImports.clsx = true;
      } else if (module === "@/components/ui/dialog") {
        // Drawn as the Starter's video pop-up, or not at all (render.mjs).
        dialog = true;
      } else if (module === "@/hooks/use-media-query") {
        // The Starter's own hook of that name (frontend/hooks).
        browserImports.mediaQuery = true;
      } else if (module === "@/components/ui/tabs") {
        // Drawn with the Starter's block-tabs.tsx (render.mjs).
        tabs = true;
      } else if (module === "@/components/ui/card") {
        // Drawn as a plain element with the card's classes (render.mjs).
        cards.push(...named.map((binding) => binding.name));
      } else if (module !== "@/components/ui/button") {
        reasons.push(
          `The component imports from "${module}", which the Starter does not have. Carry it over by hand.`,
        );
      }
    }
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      moduleValues.add(statement.name.text);
    }
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      const name = declaration.name.getText();
      const initializer = declaration.initializer;
      moduleValues.add(name);
      if (!initializer) continue;
      moduleInitializers.set(name, initializer);
      if (
        name.endsWith("Defaults") &&
        ts.isObjectLiteralExpression(initializer)
      ) {
        defaultsName = name;
        defaultsNode = initializer;
      } else if (ts.isArrowFunction(initializer) && /^[A-Z]/.test(name)) {
        components.push({ name, node: initializer });
      }
    }
  }
  // The main component is the one the Defaults object belongs to. Any other
  // component in the file is a helper the main component draws.
  const component =
    components.find(({ name }) => `${name}Defaults` === defaultsName) ??
    components[0];
  const helpers = components.filter((candidate) => candidate !== component);

  // Only the components and the Defaults are carried over. A component that
  // reads another value declared beside them would name something the
  // generated file does not have.
  moduleValues.delete(defaultsName);
  for (const { name } of components) moduleValues.delete(name);
  const missing = new Set();
  // A name a component declares itself (a parameter, a local) hides the
  // value outside it.
  const own = new Set();
  const visitOwn = (node) => {
    if (
      (ts.isParameter(node) ||
        ts.isVariableDeclaration(node) ||
        ts.isBindingElement(node)) &&
      ts.isIdentifier(node.name)
    ) {
      own.add(node.name.text);
    }
    ts.forEachChild(node, visitOwn);
  };
  for (const { node } of components) visitOwn(node);
  const visitNames = (node) => {
    if (
      ts.isIdentifier(node) &&
      moduleValues.has(node.text) &&
      !own.has(node.text)
    ) {
      const parent = node.parent;
      const isName =
        (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
        (ts.isPropertyAssignment(parent) && parent.name === node) ||
        (ts.isJsxAttribute(parent) && parent.name === node) ||
        (ts.isBindingElement(parent) && parent.propertyName === node) ||
        ts.isPropertySignature(parent);
      if (!isName) missing.add(node.text);
    }
    ts.forEachChild(node, visitNames);
  };
  for (const { node } of components) visitNames(node);
  for (const name of missing) {
    reasons.push(
      `The component reads "${name}", which is declared outside it. The converter carries over only what a component declares. Carry it over by hand.`,
    );
  }

  const imageType = aliases.get("ImageProps");
  if (imageType && ts.isTypeLiteralNode(imageType)) {
    const extra = imageType.members
      .map((member) => member.name?.getText())
      .filter((name) => name && name !== "src" && name !== "alt");
    if (extra.length) {
      reasons.push(
        `Images carry more than a picture and its alt text (${extra.join(", ")}): a linked image needs a link field. Model it by hand.`,
      );
    }
  }

  if (!component)
    throw new NeedsJudgment(["No component was found in the source."]);
  const props = aliases.get("Props");
  if (!props || !ts.isTypeLiteralNode(props)) {
    throw new NeedsJudgment([
      'The source has no "Props" type to read fields from.',
    ]);
  }
  // Relume leaves "use client" off some components that need it, so hooks
  // and Motion decide as well.
  const client =
    /^\s*["']use client["']/.test(source) ||
    /\buse[A-Z]\w*\s*\(/.test(source) ||
    browserImports.motion.length > 0;
  // Its images move: Motion and hooks drive sliders and parallax, the
  // animate-* classes drive marquees and loops.
  const moving = client || /\banimate-(?!spin|ping|pulse|bounce)/.test(source);

  const defaults = defaultsNode
    ? literalValue(defaultsNode, moduleInitializers)
    : {};
  const fields = buildFields(props, aliases, defaults, [], reasons, { tabs });
  // The component destructures its props in the order it draws them; Studio
  // shows the fields in that order.
  const drawn = [];
  const visit = (node) => {
    if (drawn.length) return;
    if (
      ts.isVariableDeclaration(node) &&
      ts.isObjectBindingPattern(node.name)
    ) {
      drawn.push(
        ...node.name.elements.map((element) => element.name.getText()),
      );
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(component.node);
  const position = (field) =>
    drawn.includes(field.sourceName)
      ? drawn.indexOf(field.sourceName)
      : drawn.length;
  fields.sort((a, b) => position(a) - position(b));
  const lead = leadField(fields);
  if (!lead) reasons.push("The Relume component has no text field to require.");

  return {
    aliasText,
    aliases,
    browserImports,
    cards,
    category,
    client,
    component,
    defaults,
    dialog,
    helpers,
    fields,
    iconImports,
    lead,
    moving,
    reasons,
    sourceFile,
    tabs,
  };
}
