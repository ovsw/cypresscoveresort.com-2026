// Rewrites the JSX a Relume component returns into the JSX of a Starter
// block: block scene, job-token classes, Sanity images, safe button
// links and click-to-edit targets.

import { hasSectionPadding, mapClasses } from "./classes.mjs";
import { isLogoImage, ts } from "./model.mjs";

// relume-icons -> lucide-react. RelumeIcon is Relume's placeholder mark.
const lucideIcons = {
  RelumeIcon: "Box",
  ChevronRight: "ChevronRight",
  ChevronLeft: "ChevronLeft",
  ChevronDown: "ChevronDown",
  ChevronUp: "ChevronUp",
  ArrowRight: "ArrowRight",
  ArrowLeft: "ArrowLeft",
  Check: "Check",
  Close: "X",
  Plus: "Plus",
  Minus: "Minus",
  Play: "Play",
  PlayCircle: "CirclePlay",
  Star: "Star",
};

// Relume button variants -> the Starter's Button variants. Relume's
// "secondary" is an outlined button.
const buttonVariants = {
  primary: "primary",
  secondary: "outline",
  tertiary: "ghost",
  link: "link",
  // Relume's buttons for a dark ground. In the Starter the scene sets the
  // ground (see photoScene), so they take the plain roles.
  alternate: "primary",
  "secondary-alt": "outline",
  "link-alt": "link",
};

// Relume's Card primitives are a <div> with a class list
// (relume/source/primitives/components/ui/card.tsx, the default variant:
// `overflow-hidden rounded-card border border-scheme-border
// bg-scheme-foreground text-scheme-text`). These are the same in the
// Starter's job tokens, as the hand-finished pricing18 draws its cards. A
// class the component sets itself wins, as in Relume's `cn`.
const cardClasses = {
  Card: "overflow-hidden rounded-card border border-border bg-card text-card-foreground",
  BackgroundCard: "overflow-hidden rounded-card",
};
// Relume's Tabs primitives (`@/components/ui/tabs`), the Starter's
// (block-tabs.tsx), and the classes Relume's give each part by default, in
// the Starter's job tokens. The focus ring and disabled state are in
// block-tabs.tsx. Relume's `whitespace-nowrap` is left out: an editor's
// label can be longer than a narrow screen, where it would be cut off.
const tabTags = {
  Tabs: "BlockTabs",
  TabsList: "BlockTabsList",
  TabsTrigger: "BlockTabsTrigger",
  TabsContent: "BlockTabsContent",
};
const tabClasses = {
  TabsList: "flex",
  TabsTrigger:
    "inline-flex items-center justify-center rounded-control px-6 py-2 border border-border text-foreground data-[state=active]:bg-card data-[state=inactive]:border-transparent",
};
// The property a class sets, with its variants (`md:`, `data-[…]:`), for
// the default classes a component's own class list replaces. Side-specific
// borders (`border-b`, `border-b-transparent`) replace nothing.
function classGroup(token) {
  const cut = token.lastIndexOf(":");
  const variant = token.slice(0, cut + 1);
  const base = token.slice(cut + 1).replace(/^!/, "");
  const group = /^(inline-flex|flex|grid|block|inline-block|inline|hidden)$/.test(base)
    ? "display"
    : /^items-/.test(base)
      ? "items"
      : /^justify-/.test(base)
        ? "justify"
        : /^rounded(-|$)/.test(base)
          ? "rounded"
          : /^overflow-/.test(base)
            ? "overflow"
            : /^p-/.test(base)
              ? "p"
              : /^px-/.test(base)
                ? "px"
                : /^py-/.test(base)
                  ? "py"
                  : /^whitespace-/.test(base)
                    ? "whitespace"
                    : /^border(-\d+)?$/.test(base)
                      ? "border-width"
                      : /^border-(?![trblxyse](-|$))/.test(base)
                        ? "border-colour"
                        : /^bg-/.test(base)
                          ? "bg"
                          : /^text-(foreground|card-foreground|white|black|neutral|scheme)/.test(base)
                            ? "text-colour"
                            : undefined;
  return group ? `${variant}${group}` : undefined;
}

// A block drawn over a photo: a covering layer holds the photo under a
// scrim (`bg-scrim`, the same on every theme), and the content layers over
// it take the Dark scene's job tokens,
// so text and buttons stay readable whatever the block's theme. The colour
// is set here because the section's own colour follows its theme.
const photoScene = "block-scene-dark text-foreground";
const isPhotoBackdrop = (node) =>
  ts.isJsxElement(node) &&
  /\babsolute\b/.test(node.openingElement.getText()) &&
  /\binset-0\b/.test(node.openingElement.getText()) &&
  /<img\b/.test(node.getText()) &&
  /\bbg-neutral-darkest\/\d+\b/.test(node.getText()) &&
  // A video pop-up's play button darkens its own poster (Header 154): that
  // layer is the button's, and the text beside it stands on the block.
  !/<Dialog\b/.test(node.getText());

// Motion hooks that tie a value to the scroll position.
const scrollHooks = new Set([
  "useMotionValue",
  "useScroll",
  "useSpring",
  "useTransform",
  "useVelocity",
]);

// What a motion element may animate, and the class that puts it at rest for
// a visitor who asked for reduced motion. Motion writes these as inline
// styles, which only an important class overrides.
const motionProps = [
  "style",
  "animate",
  "initial",
  "exit",
  "whileInView",
  "whileHover",
  "whileTap",
  "whileFocus",
];
const transformKeys = new Set(
  "x y z scale scaleX scaleY rotate rotateX rotateY rotateZ skew skewX skewY translateX translateY".split(
    " ",
  ),
);
const restClasses = {
  opacity: "motion-reduce:opacity-100!",
  transform: "motion-reduce:transform-none!",
};

// A block that pins a panel (`sticky`) while the scroll moves its content
// shows that content only as the animation runs. For reduced motion the
// panel is unpinned, the tall scroll track shrinks to its content, and a row
// that the scroll slides sideways is stacked instead.
const unpinClasses = {
  panel:
    "motion-reduce:static! motion-reduce:my-0! motion-reduce:h-auto! motion-reduce:py-12!",
  row: "motion-reduce:w-full! motion-reduce:flex-col! motion-reduce:gap-y-6!",
  track: "motion-reduce:h-auto!",
};
const sidewaysKeys = ["x", "translateX"];
// A column that loops upwards inside a clipped window shows its lower images
// only as it moves. For reduced motion the window grows to its content and
// the column starts at its top.
const verticalLoop = /\banimate-(loop-vertically|marquee-(top|bottom))/;
const loopRest = { column: "motion-reduce:mt-0!", window: "motion-reduce:h-auto!" };
// A layer laid over the whole block must not take the clicks meant for the
// buttons under it; what it draws stays clickable for click-to-edit.
const overlayClasses = "pointer-events-none *:pointer-events-auto";
const interactive = /<(a|button|Button|input|select|textarea)\b|\bbuttons\b/;
// The least space between the parts of a `justify-between` column.
const columnGap = "gap-8";

// A figure such as "30%", "$2.5M", "10k+" or "3x": a statistic's number,
// which Relume sets in a heading tag for its size.
const isFigure = (sample) =>
  typeof sample === "string" &&
  /^[\s$€£¥+~<>-]*\d[\d.,\s]*(?:%|[kKmMbBxX]|\+)*$/.test(sample.trim());

const pathLiteral = (pathCode) =>
  pathCode.includes("${") ? `\`${pathCode}\`` : JSON.stringify(pathCode);

// Whether an image spans the block's content width at every screen width:
// it fills its box (`w-full`, `size-full`), and no element around it sets
// things side by side (a grid of two or more columns, a flex row, a
// half-width box, CSS columns) or caps its width (`size-14`, `w-64`,
// `max-w-lg`). A class list that is not a plain string counts as narrowing.
const classText = (opening) => {
  const attribute = opening.attributes.properties.find(
    (property) =>
      ts.isJsxAttribute(property) && property.name.getText() === "className",
  );
  if (!attribute?.initializer) return "";
  return ts.isStringLiteral(attribute.initializer)
    ? attribute.initializer.text
    : undefined;
};
const narrowing =
  /(^|[\s:])(grid-cols-(\d{2,}|[2-9]|\[)|flex-row|w-1\/2|basis-1\/2|columns-|size-(?!full)|w-(?!full|auto|fit|max|min|screen)|max-w-(?!none|full|screen))/;
export function spansContentWidth(node) {
  const own = classText(ts.isJsxSelfClosingElement(node) ? node : node.openingElement);
  if (!own || !/(^|\s)(w-full|size-full)(?=\s|$)/.test(own)) return false;
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (!ts.isJsxElement(parent)) continue;
    const classes = classText(parent.openingElement);
    if (classes === undefined) return false;
    if (
      narrowing.test(classes) ||
      (/(^|[\s:])flex(?=\s|$)/.test(classes) &&
        !/(^|\s)flex-col(?=\s|$)/.test(classes))
    ) {
      return false;
    }
  }
  return true;
}

export function renderBlock(model, { isHero, isLogoSection = false }) {
  const { component, fields, iconImports, lead, sourceFile } = model;
  const helperNames = new Set((model.helpers ?? []).map(({ name }) => name));
  const hasMotion = (model.browserImports?.motion ?? []).some(
    ({ name }) => name === "motion",
  );
  // Values the component declares before its return, by name.
  const locals = new Map();
  const text = sourceFile.text;
  const problems = new Set();
  const uses = {
    buttons: false,
    cn: false,
    image: false,
    logo: false,
    lucide: new Set(),
    stega: false,
    headingId: false,
    heroHeadingLevels: 0,
    motion: false,
    scrollLinked: false,
    tabs: new Set(),
    video: false,
  };

  const componentText = component.node.getText(sourceFile);
  const pinned =
    /\bsticky\b/.test(componentText) &&
    [...scrollHooks].some((hook) => componentText.includes(`${hook}(`));
  let unpinnedPanels = 0;

  let root = component.node.body;
  let bodyStatements = [];
  if (ts.isBlock(root)) {
    const extra = root.statements.filter(
      (statement) =>
        !ts.isReturnStatement(statement) &&
        !(
          ts.isVariableStatement(statement) &&
          /Defaults/.test(statement.getText())
        ),
    );
    if (extra.length && !model.client) {
      problems.add(
        "The component has logic before its return statement. Carry it over by hand.",
      );
    } else if (extra.some((statement) => !ts.isVariableStatement(statement))) {
      problems.add(
        "The component does more than declare values before its return statement. Carry it over by hand.",
      );
    } else {
      bodyStatements = extra;
      for (const statement of extra) {
        for (const declaration of statement.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name) && declaration.initializer) {
            locals.set(declaration.name.text, declaration.initializer);
          }
        }
      }
    }
    root = root.statements.find(ts.isReturnStatement)?.expression;
  }
  while (root && ts.isParenthesizedExpression(root)) root = root.expression;
  if (
    !root ||
    !ts.isJsxElement(root) ||
    root.openingElement.tagName.getText() !== "section"
  ) {
    problems.add("The Relume component does not return one <section> element.");
    return {
      helpers: [],
      jsx: "",
      problems: [...problems],
      statements: [],
      uses,
    };
  }

  // Relume pads most sections on the <section> itself, which drops that
  // padding for the block padding (dropBlockPadding below). Some put it on
  // an element inside instead (Header 145's first <div>), which would stack
  // it on the block padding: when the <section> has no padding of its own,
  // the first element that carries a section's padding drops it. It keeps
  // its bottom padding when content follows it in the block (Header 145's
  // image under its text). The search follows the static elements, not a
  // list's items.
  const classLiteralOf = (element) => {
    const attribute = element.attributes.properties.find(
      (property) =>
        ts.isJsxAttribute(property) && property.name.getText() === "className",
    );
    return attribute?.initializer && ts.isStringLiteral(attribute.initializer)
      ? attribute.initializer
      : undefined;
  };
  const rootClasses = classLiteralOf(root.openingElement)?.text ?? "";
  const rootIsPadded = /(^|[\s:])(px-\[5%\]|p[ytb]-\d+)(?=\s|$)/.test(
    rootClasses,
  );
  // A layer laid over or under the block (`absolute`: Header 83's photo
  // layer after its text) takes no room, so it is not content that follows.
  const isLayer = (child) =>
    /(^|\s)absolute(\s|$)/.test(
      classLiteralOf(ts.isJsxElement(child) ? child.openingElement : child)
        ?.text ?? "",
    );
  const isContent = (child) =>
    ((ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) &&
      !isLayer(child)) ||
    (ts.isJsxExpression(child) && Boolean(child.expression)) ||
    (ts.isJsxText(child) && child.text.trim() !== "");
  let contentFollows = false;
  const sectionPaddingElement = rootIsPadded
    ? undefined
    : (function find(element, followed) {
        const children = element.children;
        for (const [index, child] of children.entries()) {
          if (!ts.isJsxElement(child) && !ts.isJsxSelfClosingElement(child)) {
            continue;
          }
          const after =
            followed || children.slice(index + 1).some(isContent);
          const opening = ts.isJsxElement(child) ? child.openingElement : child;
          if (hasSectionPadding(classLiteralOf(opening)?.text ?? "")) {
            contentFollows = after;
            return classLiteralOf(opening);
          }
          const found = ts.isJsxElement(child) ? find(child, after) : undefined;
          if (found) return found;
        }
        return undefined;
      })(root, false);
  const paddingOptions = (classLiteral) =>
    classLiteral === sectionPaddingElement
      ? { dropSectionPadding: contentFollows ? "top" : "all" }
      : undefined;

  // One roles constant per buttons field, named after where the field sits.
  const buttonFields = [];
  const nameRoles = (list, owner) => {
    for (const field of list) {
      if (field.kind === "buttons") {
        field.rolesName = owner
          ? `${owner}${field.name[0].toUpperCase()}${field.name.slice(1)}Roles`
          : `${field.name}Roles`;
        buttonFields.push(field);
      }
      if (field.item)
        nameRoles(field.item.fields, field.itemName ?? field.name);
    }
  };
  nameRoles(fields);

  const topScope = new Map(
    fields.map((field) => [
      field.sourceName,
      { field, pathCode: field.name, top: true },
    ]),
  );

  function resolve(expression, scope) {
    if (ts.isIdentifier(expression)) return scope.get(expression.text);
    if (ts.isPropertyAccessExpression(expression)) {
      const base = resolve(expression.expression, scope);
      if (!base) return undefined;
      const name = expression.name.text;
      const members = base.item?.fields ?? base.field?.item?.fields;
      const member = members?.find((field) => field.sourceName === name);
      if (member) {
        return {
          field: member,
          lead: (base.item ?? base.field.item).lead === member,
          pathCode: `${base.pathCode}.${member.name}`,
        };
      }
      if (base.field?.kind === "image" && (name === "src" || name === "alt")) {
        return { ...base, imagePart: name };
      }
    }
    return undefined;
  }

  const isRequired = (binding) =>
    binding.top ? binding.field === lead : Boolean(binding.lead);

  const meaningfulChildren = (element) =>
    element.children.filter(
      (child) => !(ts.isJsxText(child) && !child.text.trim()),
    );

  function mapCall(expression, scope) {
    if (
      !ts.isCallExpression(expression) ||
      !ts.isPropertyAccessExpression(expression.expression) ||
      expression.expression.name.text !== "map"
    ) {
      return undefined;
    }
    const target = resolve(expression.expression.expression, scope);
    if (!target) return undefined;
    return {
      call: expression,
      target,
      targetNode: expression.expression.expression,
    };
  }

  function classAttribute(element, options) {
    const attribute = element.attributes.properties.find(
      (property) =>
        ts.isJsxAttribute(property) && property.name.getText() === "className",
    );
    if (!attribute?.initializer) return "";
    if (!ts.isStringLiteral(attribute.initializer)) {
      problems.add(
        `A className built in code (${attribute.initializer.getText().slice(0, 60)}…) sits where the converter needs a plain class list.`,
      );
      return "";
    }
    return mapped(attribute.initializer.text, {
      ...paddingOptions(attribute.initializer),
      ...options,
    });
  }

  // Which layer of a block drawn over a photo is being written, if any.
  let photoLayer;

  /**
   * Writes the children of an element. When one of them is a photo backdrop
   * (isPhotoBackdrop), the element is drawn over a photo, whether it is the
   * block itself (Header 5) or a panel inside it (each of Layout 420's
   * pinned panels): the backdrop is written as the "backdrop" layer and
   * every other element as a "foreground" layer over it.
   */
  function childrenOverPhoto(children, context, write) {
    const overPhoto = children.some(isPhotoBackdrop);
    return children
      .map((child, index) => {
        if (!overPhoto || !ts.isJsxElement(child)) {
          return write(child, context, index);
        }
        const backdrop = isPhotoBackdrop(child);
        const outer = photoLayer;
        photoLayer = backdrop ? "backdrop" : "foreground";
        const output = write(
          child,
          {
            ...context,
            photoForeground: backdrop ? undefined : child.openingElement,
          },
          index,
        );
        photoLayer = outer;
        return output;
      })
      .join("");
  }

  // Classes left out of the class list being mapped: Relume's white ground
  // on a <Card> (`bg-white`), which is the card's own ground here.
  let droppedClasses = [];
  function mapped(classList, options) {
    const kept = droppedClasses.length
      ? classList
          .split(/\s+/)
          .filter((token) => !droppedClasses.includes(token))
          .join(" ")
      : classList;
    const result = mapClasses(kept, { photo: photoLayer, ...options });
    result.problems.forEach((problem) => problems.add(problem));
    return result.classes;
  }

  function buttonRolesCode(field) {
    const roles = field.roles.map((role) => {
      const variant = buttonVariants[role.variant];
      if (!variant) {
        problems.add(
          `Button variant "${role.variant}" has no Starter variant yet.`,
        );
      }
      if (role.className) {
        const icon = role.iconRight ? snippet(role.iconRight) : undefined;
        return `{ variant: ${JSON.stringify(variant)}, ${icon ? `iconRight: ${icon}, ` : ""}className: ${JSON.stringify(role.className)} }`;
      }
      if (role.iconLeft) {
        problems.add(
          "A button has an icon before its label. Place it by hand.",
        );
      }
      const icon = role.iconRight ? snippet(role.iconRight) : undefined;
      return icon
        ? `{ variant: ${JSON.stringify(variant)}, iconRight: ${icon} }`
        : `{ variant: ${JSON.stringify(variant)} }`;
    });
    return `[${roles.join(", ")}]`;
  }

  // A JSX snippet from the Defaults object: an icon element.
  function snippet(source) {
    return source
      .replace(
        /<(\/?)([A-Z]\w*)/g,
        (_, slash, tag) => `<${slash}${iconName(tag)}`,
      )
      .replace(/className="([^"]*)"/g, (_, classList) => {
        // An icon in a button takes the button's colour. Relume paints it
        // white in a button for a dark ground (Layout 326's "link-alt"),
        // which takes a plain role here.
        const classes = mapped(
          classList
            .split(/\s+/)
            .filter((token) => token !== "text-white")
            .join(" "),
        );
        return classes
          ? `aria-hidden="true" className="${classes}"`
          : 'aria-hidden="true"';
      });
  }

  /** Whether a tag is one of Relume's Card primitives, drawn as a <div>. */
  const isCard = (tag) =>
    !helperNames.has(tag) &&
    (model.cards ?? []).includes(tag) &&
    Object.hasOwn(cardClasses, tag);
  const isTabPart = (tag) =>
    !helperNames.has(tag) && model.tabs && Object.hasOwn(tabTags, tag);

  /**
   * The default classes of a Relume primitive (a card, a part of the tabs),
   * less those the element's own class list replaces: a class of the same
   * property and variants, or `p-…` for `px-…` and `py-…`.
   */
  function defaultClassesFor(element) {
    const tag = element.tagName.getText();
    const defaults = isCard(tag)
      ? cardClasses[tag]
      : isTabPart(tag)
        ? tabClasses[tag]
        : undefined;
    if (!defaults) return "";
    if (isCard(tag)) {
      for (const property of element.attributes.properties) {
        const name = ts.isJsxAttribute(property) ? property.name.getText() : "";
        if (name === "variant" || name === "asChild" || !name) {
          problems.add(
            `<${tag}> takes ${name ? `"${name}"` : "spread props"}, which the converter does not carry over for a card. Carry it over by hand.`,
          );
        }
      }
    }
    const taken = new Set(
      classListOf(element)
        .split(/\s+/)
        // Relume's white ground on a card is the card's own ground here.
        .filter((token) => !(isCard(tag) && token === "bg-white"))
        .map(classGroup)
        .filter(Boolean),
    );
    return defaults
      .split(" ")
      .filter((token) => {
        const group = classGroup(token);
        return !(
          taken.has(group) ||
          (/(^|:)p[xy]$/.test(group ?? "") &&
            taken.has(group.replace(/p[xy]$/, "p")))
        );
      })
      .join(" ");
  }

  function iconName(tag) {
    if (helperNames.has(tag)) return tag;
    if (hasMotion && /^motion\.[a-z][a-z0-9]*$/.test(tag)) {
      uses.motion = true;
      return tag;
    }
    if (isTabPart(tag)) {
      uses.tabs.add(tabTags[tag]);
      return tabTags[tag];
    }
    if (!iconImports.includes(tag)) {
      // Any other component has no import in the generated file, wherever
      // it is drawn: in the block or in a button's icon.
      if (/^[A-Z]|\./.test(tag)) {
        problems.add(
          `The component draws <${tag}>, which the converter cannot import. Carry it over by hand.`,
        );
      }
      return tag;
    }
    const icon = lucideIcons[tag];
    if (!icon) {
      problems.add(
        `Icon "${tag}" from relume-icons has no lucide-react match yet.`,
      );
      return tag;
    }
    uses.lucide.add(icon);
    return icon;
  }

  // Relume picks a heading tag for its size, so a block can jump from h2
  // to h6, or draw a big figure ("30%") as an <h1> above the block's own
  // heading. A heading that holds nothing but a figure is text, drawn as a
  // <p>. The block's own heading (its required `heading` field) takes the
  // first level, and the other levels follow it, consecutive and in the
  // same order. Only a hero may start at h1, and only when it leads the
  // page: its levels are variables (Heading1, Heading2...) set from its
  // `leadsPage` prop, one level lower anywhere else on the page.
  const headingElements = [];
  (function collect(node) {
    if (ts.isJsxElement(node) && /^h[1-6]$/.test(node.openingElement.tagName.getText())) {
      headingElements.push(node);
    }
    ts.forEachChild(node, collect);
  })(root);
  // A helper component drawn in place (inlineHelper) brings its headings
  // into the block, where they are numbered with the block's own.
  for (const helper of model.helpers ?? []) {
    (function collect(node) {
      if (ts.isJsxElement(node) && /^h[1-6]$/.test(node.openingElement.tagName.getText())) {
        headingElements.push(node);
      }
      ts.forEachChild(node, collect);
    })(helper.node);
  }
  // The text field a heading element holds alone, as written (`stat.title`).
  const onlyExpressionText = (element) => {
    const children = meaningfulChildren(element);
    return children.length === 1 &&
      ts.isJsxExpression(children[0]) &&
      children[0].expression
      ? children[0].expression.getText()
      : undefined;
  };
  const fieldsNamed = (name, list = fields) =>
    list.flatMap((field) => [
      ...(field.sourceName === name ? [field] : []),
      ...(field.item ? fieldsNamed(name, field.item.fields) : []),
    ]);
  const figureHeadings = new Set(
    headingElements.filter((element) => {
      const expression = onlyExpressionText(element);
      const named = expression
        ? fieldsNamed(expression.split(".").at(-1))
        : [];
      return (
        named.length > 0 &&
        named.every((field) => field.kind === "string" && isFigure(field.sample))
      );
    }),
  );
  const levelOf = (element) =>
    Number(element.openingElement.tagName.getText().slice(1));
  const isLeadHeading = (element) =>
    !figureHeadings.has(element) &&
    onlyExpressionText(element) === lead?.sourceName;
  const leadLevels = headingElements.filter(isLeadHeading).map(levelOf);
  // Each heading's rank in Relume. A heading that shares the block heading's
  // tag (Stats 8 draws its heading and each statistic's label as an <h3>)
  // ranks half a step below it, so it takes the next level here.
  const rankOf = (element) =>
    levelOf(element) +
    (!isLeadHeading(element) && leadLevels.includes(levelOf(element))
      ? 0.5
      : 0);
  const headingLevels = [
    ...new Set([
      ...leadLevels,
      ...headingElements
        .filter((element) => !figureHeadings.has(element))
        .map(rankOf)
        .sort((a, b) => a - b),
    ]),
  ];
  // A block's own headings start under the page's <h1>, at <h2>.
  const firstHeadingLevel = isHero ? 1 : 2;
  // A hero away from the top of the page draws every level one lower.
  const deepestHeadingLevel =
    firstHeadingLevel + headingLevels.length - 1 + (isHero ? 1 : 0);
  if (deepestHeadingLevel > 6) {
    problems.add(
      `The component uses ${headingLevels.length} heading levels, which would need an <h${deepestHeadingLevel}>. Carry it over by hand.`,
    );
  }

  // `element` is the heading element the tag opens, when there is one.
  function tagName(tag, element) {
    const heading = /^h([1-6])$/.exec(tag);
    if (heading) {
      const rank = element ? rankOf(element) : Number(heading[1]);
      const level = firstHeadingLevel + headingLevels.indexOf(rank);
      if (!isHero) return `h${level}`;
      uses.heroHeadingLevels = Math.max(uses.heroHeadingLevels, level);
      return `Heading${level}`;
    }
    return iconName(tag);
  }

  // The test a text field must pass to be drawn, when `child` is an element
  // that holds nothing but one optional text field.
  function optionalTextCondition(child, context) {
    if (!child || !ts.isJsxElement(child)) return undefined;
    const children = meaningfulChildren(child);
    const only =
      children.length === 1 &&
      ts.isJsxExpression(children[0]) &&
      children[0].expression;
    const binding = only ? resolve(only, context.scope) : undefined;
    if (binding?.field.kind !== "string" || isRequired(binding))
      return undefined;
    uses.stega = true;
    return `stegaClean(${inner(only, context)})?.trim()`;
  }

  /**
   * A single button the component draws itself:
   * `<Button {...button}>{button.title}</Button>`, where `button` is a
   * single-button field. Returns its binding and the code that reads the
   * field, or undefined. A class on the button itself (`w-full`) goes to
   * the button's role.
   */
  function singleButton(node, context) {
    if (
      !ts.isJsxElement(node) ||
      node.openingElement.tagName.getText() !== "Button"
    ) {
      return undefined;
    }
    const properties = node.openingElement.attributes.properties;
    const spread = properties.find(ts.isJsxSpreadAttribute);
    const binding = spread
      ? resolve(spread.expression, context.scope)
      : undefined;
    if (binding?.field?.kind !== "buttons" || !binding.field.single) {
      return undefined;
    }
    const children = meaningfulChildren(node);
    const label =
      children.length === 1 && ts.isJsxExpression(children[0])
        ? children[0].expression?.getText()
        : undefined;
    const others = properties.filter(
      (property) =>
        property !== spread &&
        !(ts.isJsxAttribute(property) && property.name.getText() === "className"),
    );
    // A button that submits a form is not a link.
    let inForm = false;
    for (let parent = node.parent; parent; parent = parent.parent) {
      if (
        ts.isJsxElement(parent) &&
        parent.openingElement.tagName.getText() === "form"
      ) {
        inForm = true;
      }
    }
    if (inForm) {
      problems.add(
        `The single button "${spread.expression.getText()}" submits a form, which the Starter's link buttons cannot do. Carry it over by hand.`,
      );
      return undefined;
    }
    if (label !== `${spread.expression.getText()}.title` || others.length) {
      problems.add(
        `The single button "${spread.expression.getText()}" is drawn in a way the converter does not know. Carry it over by hand.`,
      );
      return undefined;
    }
    const own = classAttribute(node.openingElement);
    if (own) binding.field.roles[0].className = own;
    return { binding, code: inner(spread.expression, context) };
  }

  function blockButtons(binding, expressionText, className) {
    uses.buttons = true;
    const path =
      binding.pathCode === "buttons"
        ? ""
        : ` path={${pathLiteral(binding.pathCode)}}`;
    const classes = className ? ` className="${className}"` : "";
    return `<BlockButtons buttons={${expressionText}}${classes} dataAttribute={dataAttribute}${path} roles={${binding.field.rolesName}} />`;
  }

  function attributes(element, context, skip = [], appendClass = "") {
    let hasClass = false;
    const output = element.attributes.properties
      .filter(
        (property) =>
          !(
            ts.isJsxAttribute(property) &&
            skip.includes(property.name.getText())
          ),
      )
      .map((property) => {
        if (
          appendClass &&
          ts.isJsxAttribute(property) &&
          property.name.getText() === "className" &&
          property.initializer
        ) {
          hasClass = true;
          const value = property.initializer;
          if (ts.isStringLiteral(value)) {
            const own = mapped(value.text, paddingOptions(value));
            return ` className="${[own, appendClass].filter(Boolean).join(" ")}"`;
          }
          uses.cn = true;
          const expression = inner(value.expression, {
            ...context,
            className: true,
          });
          return ` className={cn(${expression}, ${JSON.stringify(appendClass)})}`;
        }
        const output = inner(property, context);
        return output ? ` ${output}` : "";
      })
      .join("");
    return appendClass && !hasClass
      ? `${output} className="${appendClass}"`
      : output;
  }

  // The names a motion prop animates, or undefined when they cannot be read.
  function animatedKeys(expression, context, seen = new Set()) {
    let node = expression;
    while (
      node &&
      (ts.isParenthesizedExpression(node) ||
        ts.isAsExpression(node) ||
        ts.isSatisfiesExpression(node))
    ) {
      node = node.expression;
    }
    if (!node) return undefined;
    if (
      node.kind === ts.SyntaxKind.FalseKeyword ||
      node.kind === ts.SyntaxKind.TrueKeyword
    ) {
      return [];
    }
    if (ts.isIdentifier(node)) {
      const local = locals.get(node.text);
      if (!local || seen.has(node.text)) return undefined;
      return animatedKeys(local, context, new Set([...seen, node.text]));
    }
    if (!ts.isObjectLiteralExpression(node)) return undefined;
    const keys = [];
    for (const property of node.properties) {
      if (
        !ts.isPropertyAssignment(property) &&
        !ts.isShorthandPropertyAssignment(property)
      ) {
        return undefined;
      }
      const name = property.name;
      if (ts.isIdentifier(name) || ts.isStringLiteral(name)) {
        if (name.text !== "transition") keys.push(name.text);
        continue;
      }
      // A computed name, such as [axis]: its type must list the names.
      const type =
        ts.isComputedPropertyName(name) && ts.isIdentifier(name.expression)
          ? context.propTypes?.get(name.expression.text)
          : undefined;
      const members = type && ts.isUnionTypeNode(type) ? type.types : [];
      if (
        !members.length ||
        !members.every(
          (member) =>
            ts.isLiteralTypeNode(member) && ts.isStringLiteral(member.literal),
        )
      ) {
        return undefined;
      }
      keys.push(...members.map((member) => member.literal.text));
    }
    return keys;
  }

  // The size a scroll-linked `width` or `height` ends at: the last output
  // of its `useTransform(progress, [...], ["90%", "100%"])`, when that is a
  // plain length. `expression` is the motion prop's value.
  function sizeAtEnd(expression, key) {
    const valueOf = (node, seen = new Set()) => {
      while (
        node &&
        (ts.isParenthesizedExpression(node) || ts.isAsExpression(node))
      ) {
        node = node.expression;
      }
      if (node && ts.isIdentifier(node) && !seen.has(node.text)) {
        return valueOf(locals.get(node.text), new Set([...seen, node.text]));
      }
      return node;
    };
    const style = valueOf(expression);
    if (!style || !ts.isObjectLiteralExpression(style)) return undefined;
    const property = style.properties.find(
      (candidate) => candidate.name?.getText() === key,
    );
    const value = property
      ? valueOf(
          ts.isShorthandPropertyAssignment(property)
            ? property.name
            : property.initializer,
        )
      : undefined;
    if (
      !value ||
      !ts.isCallExpression(value) ||
      value.expression.getText() !== "useTransform"
    ) {
      return undefined;
    }
    const outputs = value.arguments[2];
    const last =
      outputs && ts.isArrayLiteralExpression(outputs)
        ? outputs.elements.at(-1)
        : undefined;
    return last &&
      ts.isStringLiteral(last) &&
      /^\d+(\.\d+)?(%|vh|vw|svh|dvh|px|rem)$/.test(last.text)
      ? last.text
      : undefined;
  }

  // The classes that hold a motion element still for reduced motion.
  function restClassesFor(element, context, animated) {
    const classes = new Set();
    for (const property of element.attributes.properties) {
      if (!ts.isJsxAttribute(property)) {
        problems.add(
          `<${element.tagName.getText()}> takes spread props, so the converter cannot tell what it animates.`,
        );
        continue;
      }
      const name = property.name.getText();
      if (!motionProps.includes(name)) continue;
      const keys = property.initializer?.expression
        ? animatedKeys(property.initializer.expression, context)
        : undefined;
      if (!keys) {
        problems.add(
          `The converter cannot read what "${name}" animates on <${element.tagName.getText()}>, so it cannot hold it still for reduced motion. Carry it over by hand.`,
        );
        continue;
      }
      for (const key of keys) {
        animated.add(key);
        if (transformKeys.has(key)) classes.add(restClasses.transform);
        else if (key === "opacity") classes.add(restClasses.opacity);
        else if (
          (key === "width" || key === "height") &&
          sizeAtEnd(property.initializer.expression, key)
        ) {
          // A size the scroll grows (Header 82's video, from 90% to the full
          // width) rests at the size it ends at.
          classes.add(
            `motion-reduce:${key === "width" ? "w" : "h"}-[${sizeAtEnd(property.initializer.expression, key)}]!`,
          );
        } else {
          problems.add(
            `<${element.tagName.getText()}> animates "${key}". Decide by hand what a visitor with reduced motion sees.`,
          );
        }
      }
    }
    return [...classes].sort().join(" ");
  }

  // A helper component takes no content but images: a text field passed to
  // it would lose its optional-text test and its click-to-edit target.
  function checkHelperCall(element, context) {
    for (const property of element.attributes.properties) {
      const expression =
        ts.isJsxAttribute(property) && property.initializer?.expression;
      const binding = expression ? resolve(expression, context.scope) : null;
      if (binding?.item || (binding?.field && binding.field.kind !== "image")) {
        problems.add(
          `<${element.tagName.getText()}> is given the field "${expression.getText()}". The converter passes only images to a helper component. Carry it over by hand.`,
        );
      } else if (
        binding?.field &&
        !isLogoSection &&
        isLogoImage(binding.field)
      ) {
        // The helper draws every image it is given alike, so it cannot tell
        // a logo (white on a Dark theme) from a photo.
        problems.add(
          `<${element.tagName.getText()}> is given the logo "${expression.getText()}". The converter cannot draw a logo inside a helper component. Carry it over by hand.`,
        );
      }
    }
  }

  function elementClass(element, context) {
    const tag = element.tagName.getText();
    if (helperNames.has(tag)) checkHelperCall(element, context);
    const animated = new Set();
    const classes =
      hasMotion && tag.startsWith("motion.")
        ? [restClassesFor(element, context, animated)]
        : [];
    if (pinned) classes.push(unpinClassesFor(element, animated));
    classes.push(layoutRestClasses(element));
    if (context.photoForeground === element) {
      // The layer's own "text-white" has become "text-foreground" already.
      classes.push(
        /\btext-white\b/.test(ownClassText(element))
          ? photoScene.replace(" text-foreground", "")
          : photoScene,
      );
      // Motion gives an element it animates a stacking context of its own
      // (will-change), which traps the `z-10` of the text inside it under
      // the photo layer that follows (Header 83). Such a layer is raised
      // itself, unless it already sets its own place in the stack.
      if (
        tag.startsWith("motion.") &&
        !/(^|[\s"'`:])-?z-/.test(ownClassText(element))
      ) {
        classes.push("relative z-10");
      }
    }
    // The scrim lets a click through to the photo, for click-to-edit.
    if (
      photoLayer === "backdrop" &&
      /\bbg-neutral-darkest\/\d+\b/.test(element.getText())
    ) {
      classes.push("pointer-events-none!");
    }
    return classes.filter(Boolean).join(" ");
  }

  /** The source text of an element's own className attribute. */
  function ownClassText(element) {
    return (
      element.attributes.properties
        .find(
          (property) =>
            ts.isJsxAttribute(property) &&
            property.name.getText() === "className",
        )
        ?.initializer?.getText() ?? ""
    );
  }

  // Classes an element needs whatever the block animates with.
  function layoutRestClasses(element) {
    const own = ownClassText(element);
    const has = (token) =>
      new RegExp(`(^|[\\s"'\`])${token}(?=[\\s"'\`]|$)`).test(own);
    const subtree = ts.isJsxOpeningElement(element)
      ? element.parent.getText()
      : "";
    const classes = [];
    if (verticalLoop.test(own)) classes.push(loopRest.column);
    else if (
      has("overflow-hidden") &&
      /(^|[\s"'`:])h-/.test(own) &&
      verticalLoop.test(subtree)
    ) {
      classes.push(loopRest.window);
    }
    if (
      subtree &&
      has("absolute") &&
      has("inset-0") &&
      /(^|[\s"'`])z-\d/.test(own) &&
      !interactive.test(subtree.slice(element.getText().length))
    ) {
      classes.push(overlayClasses);
    }
    // A covering layer that holds a video pop-up in a pinned block (Header
    // 154's poster under the text panel that slides away): unpinned for
    // reduced motion, the panel no longer moves off it, so the layer takes
    // its own place under the text.
    if (
      pinned &&
      subtree &&
      has("absolute") &&
      has("inset-0") &&
      /<Dialog\b/.test(subtree)
    ) {
      classes.push(
        "motion-reduce:relative! motion-reduce:inset-auto! motion-reduce:h-auto!",
      );
    }
    if (needsColumnGap(element, has)) classes.push(columnGap);
    return classes.join(" ");
  }

  // A column that pushes its parts apart (`flex-col justify-between`) with
  // no gap and no margin between them leaves them touching when the column
  // has no spare height, as in a row of cards of equal height.
  function needsColumnGap(element, has) {
    if (!ts.isJsxOpeningElement(element)) return false;
    if (!has("flex") || !has("flex-col") || !has("justify-between")) {
      return false;
    }
    const own = classListOf(element);
    if (/(^|\s|:)(gap|gap-y|space-y)-/.test(own)) return false;
    const parts = element.parent.children.filter(
      (child) => ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child),
    );
    return (
      parts.length >= 2 &&
      parts.every(
        (part) =>
          !/(^|\s|:)-?m[tby]?-/.test(
            classListOf(ts.isJsxElement(part) ? part.openingElement : part),
          ),
      )
    );
  }

  function classListOf(element) {
    const value = element.attributes.properties.find(
      (property) =>
        ts.isJsxAttribute(property) && property.name.getText() === "className",
    )?.initializer;
    return value && ts.isStringLiteral(value) ? value.text : "";
  }

  // The reduced-motion layout of an element in a pinned scroll block.
  function unpinClassesFor(element, animated) {
    const own = element.attributes.properties.find(
      (property) =>
        ts.isJsxAttribute(property) && property.name.getText() === "className",
    )?.initializer;
    const tokens =
      own && ts.isStringLiteral(own) ? own.text.split(/\s+/) : [];
    const classes = [];
    if (tokens.includes("sticky")) {
      unpinnedPanels += 1;
      classes.push(unpinClasses.panel);
    }
    // The track is taller than the screen, to give the scroll its distance.
    if (
      tokens.some((token) => Number(/^h-\[(\d+)vh\]$/.exec(token)?.[1]) > 100)
    ) {
      classes.push(unpinClasses.track);
    }
    if (sidewaysKeys.some((key) => animated.has(key))) {
      if (tokens.includes("flex")) classes.push(unpinClasses.row);
      else {
        problems.add(
          `<${element.tagName.getText()}> slides sideways in a pinned block and is not a flex row, so the converter cannot stack it for reduced motion. Carry it over by hand.`,
        );
      }
    }
    return classes.join(" ");
  }

  /**
   * Relume's video pop-up: a <Dialog> whose trigger is a play button (a
   * poster image, a dark layer over it, a play icon) and whose content is
   * one <iframe> that plays a video field. It becomes the Starter's
   * BlockVideoDialog around the play button; the dialog's content, its
   * loading spinner and the state that tracks it go, since the helper owns
   * them. The button takes the Dark scene, as text over a photo does: its
   * dark layer is a scrim and its icon the scene's foreground. A click on
   * the icon edits the video link, a click on the poster its image.
   */
  function videoDialog(node, context) {
    const parts = meaningfulChildren(node);
    const named = (name) =>
      parts.find(
        (part) =>
          ts.isJsxElement(part) &&
          part.openingElement.tagName.getText() === name,
      );
    const trigger = named("DialogTrigger");
    const content = named("DialogContent");
    const frames = [];
    (function find(child) {
      if (
        (ts.isJsxSelfClosingElement(child) || ts.isJsxOpeningElement(child)) &&
        child.tagName.getText() === "iframe"
      ) {
        frames.push(child);
      }
      ts.forEachChild(child, find);
    })(content ?? node);
    const source = frames[0]?.attributes.properties.find(
      (property) =>
        ts.isJsxAttribute(property) && property.name.getText() === "src",
    )?.initializer?.expression;
    const binding = source ? resolve(source, context.scope) : undefined;
    // The replacement draws none of the dialog's content, so it may hold
    // only what BlockVideoDialog has: the <iframe> and the spinner shown
    // while it loads (`{!isIframeLoaded && <ProgressActivity />}`).
    const extras = content
      ? meaningfulChildren(content).filter(
          (child) =>
            !(
              (ts.isJsxSelfClosingElement(child) || ts.isJsxElement(child)) &&
              (ts.isJsxElement(child) ? child.openingElement : child).tagName.getText() === "iframe"
            ) &&
            !(
              ts.isJsxExpression(child) &&
              /^\{\s*!\w+\s*&&\s*\(?\s*<ProgressActivity\b[^<]*\/>\s*\)?\s*\}$/.test(
                child.getText(),
              )
            ),
        )
      : [];
    const asChild = trigger?.openingElement.attributes.properties.some(
      (property) =>
        ts.isJsxAttribute(property) && property.name.getText() === "asChild",
    );
    const inside = trigger ? meaningfulChildren(trigger) : [];
    const button = asChild ? inside[0] : trigger;
    if (
      !trigger ||
      !content ||
      parts.length !== 2 ||
      frames.length !== 1 ||
      extras.length > 0 ||
      binding?.field.kind !== "video" ||
      (asChild &&
        (inside.length !== 1 ||
          !ts.isJsxElement(button) ||
          !/^(motion\.)?button$/.test(button.openingElement.tagName.getText())))
    ) {
      problems.add(
        "The component draws a <Dialog> that is not a video pop-up (a play button that opens one <iframe> playing a video field). Carry it over by hand.",
      );
      return node.getText();
    }
    binding.field.drawn = true;
    uses.video = true;
    const opening = button.openingElement;
    const tag = asChild ? tagName(opening.tagName.getText(), button) : "button";
    const typed = opening.attributes.properties.some(
      (property) =>
        ts.isJsxAttribute(property) && property.name.getText() === "type",
    );
    const childContext = {
      ...context,
      jsxChild: true,
      videoTarget: binding.pathCode,
    };
    const outer = photoLayer;
    const body = [...button.children]
      .map((child) => {
        photoLayer =
          ts.isJsxText(child) || !/\bbg-neutral-darkest\/\d+\b/.test(child.getText())
            ? "foreground"
            : "backdrop";
        return full(child, childContext);
      })
      .join("");
    photoLayer = outer;
    const own = attributes(
      opening,
      context,
      ["asChild"],
      [elementClass(opening, context), "block-scene-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"]
        .filter(Boolean)
        .join(" "),
    );
    return `<BlockVideoDialog video={${inner(source, context)}}><${tag}${typed ? "" : ' type="button"'}${own}>${body}</${tag}></BlockVideoDialog>`;
  }

  // Helper components drawn in place, and those still drawn as components.
  const inlinedHelpers = new Set();
  const keptHelpers = new Set();
  // The helpers being drawn in place right now: one that draws itself
  // would never end.
  const activeHelpers = new Set();

  /**
   * Draws a helper component in place of its call, when the call hands it
   * content: a list item or an object (`<FeatureCard {...feature} />`,
   * `<FeatureCard tab={tab} />`), or the helper draws a heading. Its JSX
   * then sits in the block, so its texts get their optional-text test and
   * click-to-edit target, its buttons their roles, and its headings a level
   * among the block's own. A helper that takes only images stays a
   * component, as before. Returns undefined when the helper is not drawn in
   * place: it keeps state or calls a hook, takes children, or declares more
   * than plain values before its return.
   */
  function inlineHelper(call, context, depth = 0) {
    const name = call.tagName.getText();
    const helper = (model.helpers ?? []).find((candidate) => candidate.name === name);
    if (!helper || depth > 3) return undefined;
    if (activeHelpers.has(name)) {
      problems.add(
        `The helper component ${name} draws itself, so it cannot be drawn in place. Carry it over by hand.`,
      );
      return undefined;
    }
    const helperText = helper.node.getText();
    if (/\buse[A-Z]\w*\s*\(/.test(helperText)) return undefined;

    // What the call passes: spread bindings and named props.
    const spreads = [];
    const named = new Map();
    let key;
    for (const property of call.attributes.properties) {
      if (ts.isJsxSpreadAttribute(property)) {
        const binding = resolve(property.expression, context.scope);
        if (!binding) return undefined;
        spreads.push({ binding, expression: property.expression });
      } else if (property.name.getText() === "key") {
        key = property.initializer?.expression;
      } else if (property.initializer?.expression) {
        named.set(property.name.getText(), property.initializer.expression);
      } else {
        return undefined;
      }
    }
    const passesContent =
      spreads.length > 0 ||
      [...named.values()].some((expression) => {
        const binding = resolve(expression, context.scope);
        return binding?.item || (binding?.field && binding.field.kind !== "image");
      });
    if (!passesContent && !/<h[1-6]\b/.test(helperText)) return undefined;
    if (spreads.length > 1) return undefined;

    // The helper's body: plain values, then one returned element.
    let body = helper.node.body;
    const values = [];
    if (ts.isBlock(body)) {
      for (const statement of body.statements) {
        if (ts.isReturnStatement(statement)) continue;
        if (
          !ts.isVariableStatement(statement) ||
          !statement.declarationList.declarations.every(
            (declaration) =>
              ts.isIdentifier(declaration.name) && declaration.initializer,
          )
        ) {
          return undefined;
        }
        values.push(...statement.declarationList.declarations);
      }
      body = body.statements.find(ts.isReturnStatement)?.expression;
    }
    while (body && ts.isParenthesizedExpression(body)) body = body.expression;
    if (!body || !ts.isJsxElement(body)) return undefined;

    const code = (expression) => inner(expression, { ...context, jsxChild: false });
    const passed = (expression) => {
      const binding = resolve(expression, context.scope);
      return binding
        ? { ...binding, code: code(expression) }
        : { code: `(${code(expression)})` };
    };
    const member = (spread, memberName) => {
      const { binding } = spread;
      const owner = binding.item ?? binding.field?.item;
      const field = owner?.fields.find(
        (candidate) => candidate.sourceName === memberName,
      );
      if (!field) return undefined;
      const access = binding.field?.kind === "object" ? "?." : ".";
      return {
        field,
        lead: owner.lead === field,
        pathCode: `${binding.pathCode}.${field.name}`,
        code: `${code(spread.expression)}${access}${field.name}`,
      };
    };

    const scope = new Map();
    const [parameter] = helper.node.parameters;
    if (helper.node.parameters.length > 1) return undefined;
    if (parameter && ts.isIdentifier(parameter.name)) {
      // `(feature: Feature)`: the whole props object, which must be one
      // spread item.
      if (spreads.length !== 1 || named.size) return undefined;
      scope.set(parameter.name.text, {
        ...spreads[0].binding,
        code: code(spreads[0].expression),
      });
    } else if (parameter && ts.isObjectBindingPattern(parameter.name)) {
      for (const element of parameter.name.elements) {
        if (!ts.isIdentifier(element.name) || element.initializer) return undefined;
        const local = element.name.text;
        const prop = element.propertyName?.getText() ?? local;
        if (element.dotDotDotToken) {
          // `...rest`: what the spread item holds.
          if (spreads.length !== 1) return undefined;
          scope.set(local, {
            ...spreads[0].binding,
            code: code(spreads[0].expression),
          });
        } else if (named.has(prop)) {
          scope.set(local, passed(named.get(prop)));
        } else {
          const found = spreads[0] ? member(spreads[0], prop) : undefined;
          if (!found) return undefined;
          scope.set(local, found);
        }
      }
    } else if (parameter) {
      return undefined;
    }

    inlinedHelpers.add(name);
    activeHelpers.add(name);
    const helperContext = { ...context, scope, nested: true };
    for (const declaration of values) {
      scope.set(declaration.name.text, {
        code: `(${inner(declaration.initializer, { ...helperContext, jsxChild: false })})`,
      });
    }
    // The helper's element stands where its call stood: as a JSX child an
    // optional text's test needs braces, in a map callback it is an
    // expression.
    let output = inner(body, helperContext);
    activeHelpers.delete(name);
    if (key) {
      const keyCode =
        context.item && key.getText() === context.item.index
          ? `${context.item.name}._key`
          : code(key);
      output = output.replace(/^<([\w.]+)/, `<$1 key={${keyCode}}`);
    }
    return output;
  }

  function full(node, context) {
    if (ts.isJsxText(node)) return text.slice(node.pos, node.end);
    return text.slice(node.pos, node.getStart()) + inner(node, context);
  }

  function inner(node, context) {
    if (ts.isJsxText(node)) return text.slice(node.pos, node.end);

    if (
      ts.isJsxElement(node) &&
      model.dialog &&
      node.openingElement.tagName.getText() === "Dialog"
    ) {
      return videoDialog(node, context);
    }

    if (ts.isJsxElement(node)) {
      // A single button on its own, before its tag is looked up.
      const single = singleButton(node, context);
      if (single) return blockButtons(single.binding, single.code, "contents");

      const opening = node.openingElement;
      // A helper called with children is not drawn in place, so it stays a
      // component the block declares.
      if (helperNames.has(opening.tagName.getText())) {
        keptHelpers.add(opening.tagName.getText());
      }
      const card = isCard(opening.tagName.getText());
      const tag = card
        ? "div"
        : figureHeadings.has(node)
          ? "p"
          : tagName(opening.tagName.getText(), node);
      const children = meaningfulChildren(node);
      const only =
        children.length === 1 &&
        ts.isJsxExpression(children[0]) &&
        children[0].expression
          ? children[0].expression
          : undefined;

      // A single button as the only thing in its wrapper.
      // The wrapper goes only when it carries nothing but its classes: an
      // `id` a link points at, or any other attribute, stays with it.
      const plainWrapper = opening.attributes.properties.every(
        (property) =>
          ts.isJsxAttribute(property) &&
          ["className", "key"].includes(property.name.getText()) &&
          !(property.name.getText() === "key" && context.item),
      );
      const wrapped =
        children.length === 1 && !card && plainWrapper
          ? singleButton(children[0], context)
          : undefined;
      if (wrapped) {
        return blockButtons(
          wrapped.binding,
          wrapped.code,
          classAttribute(opening) || "contents",
        );
      }

      // A wrapper that holds nothing but the buttons becomes the buttons.
      const buttons = only ? mapCall(only, context.scope) : undefined;
      if (buttons?.target.field.kind === "buttons") {
        // Over a photo, buttons that are the whole foreground layer take
        // the Dark scene, as any other foreground layer does in
        // elementClass.
        return blockButtons(
          buttons.target,
          inner(buttons.targetNode, context),
          [
            classAttribute(opening),
            context.photoForeground === opening ? photoScene : "",
          ]
            .filter(Boolean)
            .join(" "),
        );
      }

      const extra = [];
      let condition;
      const binding = only ? resolve(only, context.scope) : undefined;
      if (binding?.field.kind === "string") {
        extra.push(
          ` data-sanity={dataAttribute?.(${pathLiteral(binding.pathCode)})}`,
        );
        if (binding.top && binding.field === lead) {
          extra.push(" id={headingId}");
          uses.headingId = true;
        }
        if (!isRequired(binding)) {
          uses.stega = true;
          condition = `stegaClean(${inner(only, context)})?.trim()`;
        }
      }

      const childContext = { ...context, jsxChild: true };
      if (card) droppedClasses = ["bg-white"];
      const openingTag = `<${tag}${attributes(opening, context, [], [elementClass(opening, context), defaultClassesFor(opening)].filter(Boolean).join(" "))}${extra.join("")}>`;
      droppedClasses = [];
      const output =
        openingTag +
        childrenOverPhoto([...node.children], childContext, (child, childContext, index) => {
            // Punctuation between two optional texts is drawn only when both
            // are filled, so an empty field leaves no stray separator.
            if (
              ts.isJsxText(child) &&
              /^[\s,;:|/·•–—-]*[,;:|/·•–—-][\s,;:|/·•–—-]*$/.test(child.text)
            ) {
              const before = optionalTextCondition(
                node.children[index - 1],
                context,
              );
              const after = optionalTextCondition(
                node.children[index + 1],
                context,
              );
              if (before && after) {
                const separator = child.text.replace(/\s+/g, " ");
                return `{${before} && ${after} ? ${JSON.stringify(separator)} : null}`;
              }
            }
            return full(child, childContext);
          }) +
        `</${tag}>`;
      if (!condition) return output;
      return context.jsxChild
        ? `{${condition} ? (${output}) : null}`
        : `${condition} ? (${output}) : null`;
    }

    if (ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText();
      if (helperNames.has(tag)) {
        const inlined = inlineHelper(node, context);
        if (inlined !== undefined) return inlined;
        keptHelpers.add(tag);
      }
      if (tag === "img") {
        const source = node.attributes.properties.find(
          (property) =>
            ts.isJsxAttribute(property) && property.name.getText() === "src",
        );
        const expression = source?.initializer?.expression;
        const binding = expression
          ? resolve(expression, context.scope)
          : undefined;
        if (binding?.field.kind !== "image" || binding.imagePart !== "src") {
          problems.add(
            `An <img> does not take its source from an image field (${source?.getText() ?? "no src"}). Place it by hand.`,
          );
          return node.getText();
        }
        uses.image = true;
        const className = classAttribute(node);
        const keyed = node.attributes.properties.some(
          (property) =>
            ts.isJsxAttribute(property) && property.name.getText() === "key",
        );
        const key =
          keyed && context.item ? ` key={${context.item.name}._key}` : "";
        // An image a helper component receives has no path of its own.
        const target = binding.pathCode
          ? ` dataSanity={dataAttribute?.(${pathLiteral(binding.pathCode)})}`
          : "";
        // A photo behind the whole block spans the page at every width, and
        // so does an image that fills the content width (Header 145's photo
        // under its text, spansContentWidth). BlockImage's default hint is half the page on a
        // desktop, which would load a blurred image there. An image in a
        // list or a helper component keeps the default.
        const sizes =
          photoLayer === "backdrop" ||
          (!context.item && binding.pathCode && spansContentWidth(node))
            ? ' sizes="100vw"'
            : "";
        // A logo is drawn in white on a Dark theme, with the classes the
        // hand-finished logo3 shares (blockLogoClassName in block-image.tsx):
        // every image of a logo section, and a logo image elsewhere.
        let classProp = className ? ` className="${className}"` : "";
        if (isLogoSection || isLogoImage(binding.field)) {
          uses.logo = true;
          if (className) uses.cn = true;
          classProp = className
            ? ` className={cn("${className}", blockLogoClassName)}`
            : " className={blockLogoClassName}";
        }
        return `<BlockImage${key}${classProp}${target} image={${inner(expression.expression, context)}}${sizes} />`;
      }
      // An image Motion animates itself (Layout 517's `<motion.img>`) is
      // not Sanity's image component.
      if (tag === "motion.img") {
        problems.add(
          "A <motion.img> is animated itself, and the Starter draws images with its own component. Place it by hand.",
        );
      }
      const renamedTag = tagName(tag);
      const decorative = renamedTag !== tag ? ' aria-hidden="true"' : "";
      // The play icon of a video pop-up is where an editor clicks to change
      // the video (see videoDialog).
      const videoTarget =
        context.videoTarget && tag === "PlayCircle"
          ? ` data-sanity={dataAttribute?.(${pathLiteral(context.videoTarget)})}`
          : "";
      return `<${renamedTag}${decorative}${attributes(node, context, [], elementClass(node, context))}${videoTarget} />`;
    }

    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText();
      if (name === "className" && node.initializer) {
        if (ts.isStringLiteral(node.initializer)) {
          const classes = mapped(
            node.initializer.text,
            paddingOptions(node.initializer),
          );
          // A class list left empty (only the section padding) goes.
          return classes ? `className="${classes}"` : "";
        }
        return `className=${inner(node.initializer, { ...context, className: true })}`;
      }
      // The tab that opens first is the first tab.
      if (
        name === "defaultValue" &&
        isTabPart(node.parent.parent.tagName?.getText() ?? "")
      ) {
        const list = fields.find(
          (field) => field.kind === "list" && field.item.tabValue,
        );
        if (list) return `defaultValue={${list.name}?.[0]?._key}`;
      }
      if (name === "key" && context.item && node.initializer?.expression) {
        if (node.initializer.expression.getText() === context.item.index) {
          return `key={${context.item.name}._key}`;
        }
      }
    }

    if (context.className && ts.isStringLiteralLike(node)) {
      const quote = text[node.getStart()];
      return `${quote}${mapped(node.text)}${quote}`;
    }

    // The fixed parts of a class list written as a template literal.
    if (
      context.className &&
      (node.kind === ts.SyntaxKind.TemplateHead ||
        node.kind === ts.SyntaxKind.TemplateMiddle ||
        node.kind === ts.SyntaxKind.TemplateTail)
    ) {
      const isHead = node.kind === ts.SyntaxKind.TemplateHead;
      const isTail = node.kind === ts.SyntaxKind.TemplateTail;
      const raw = text.slice(node.getStart(), node.end);
      const close = isTail ? "`" : "${";
      const body = raw.slice(1, raw.length - close.length);
      if (
        body &&
        ((!isHead && !/^\s/.test(body)) || (!isTail && !/\s$/.test(body)))
      ) {
        problems.add(
          `A class name is put together from pieces (${raw.slice(0, 40)}…), so the converter cannot map it.`,
        );
      }
      const before = /^\s*/.exec(body)[0] && body.trim() ? " " : "";
      const after = /\s$/.test(body) ? " " : "";
      return `${raw[0]}${before}${mapped(body.trim())}${after}${close}`;
    }

    // A class list kept in a value, such as `positionClasses: "..."`.
    if (
      ts.isPropertyAssignment(node) &&
      /class(Name|es)?$/i.test(node.name.getText()) &&
      ts.isStringLiteralLike(node.initializer)
    ) {
      return `${node.name.getText()}: ${JSON.stringify(mapped(node.initializer.text))}`;
    }

    // An image picked from a list by position. Studio requires that many
    // images (see `indexed` in emit.mjs), and a missing one draws nothing.
    if (ts.isElementAccessExpression(node) && ts.isIdentifier(node.expression)) {
      const base = context.scope.get(node.expression.text);
      if (base?.top && ["imageList", "list"].includes(base.field.kind)) {
        const index = node.argumentExpression;
        if (base.field.kind === "imageList" && ts.isNumericLiteral(index)) {
          base.field.indexed = Math.max(
            base.field.indexed ?? 0,
            Number(index.text) + 1,
          );
          return `(${base.field.name}?.[${index.text}] ?? null)`;
        }
        problems.add(
          `"${node.getText()}" picks an item of a list by position in a way the converter does not know. Carry it over by hand.`,
        );
      }
    }

    // A list of images styled by position: Header 83 hides images 0, 2, 3,
    // 5, 6 and 8 of its three by three grid on a phone
    // (`[0, 2, 3, 5, 6, 8].indexOf(index)`), so the design holds as many
    // images as the highest position named, and Studio asks for exactly
    // that many.
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ["indexOf", "includes"].includes(node.expression.name.text) &&
      ts.isArrayLiteralExpression(node.expression.expression) &&
      node.expression.expression.elements.length > 0 &&
      node.expression.expression.elements.every(ts.isNumericLiteral) &&
      context.item?.field?.kind === "imageList" &&
      context.item.index &&
      node.arguments[0]?.getText() === context.item.index
    ) {
      const positions = node.expression.expression.elements.map((element) =>
        Number(element.text),
      );
      context.item.field.indexed = Math.max(
        context.item.field.indexed ?? 0,
        Math.max(...positions) + 1,
      );
    }

    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      /^use[A-Z]/.test(node.expression.text)
    ) {
      if (context.nested) {
        problems.add(
          `The hook ${node.expression.text} is called inside a loop or a callback, which React forbids. Carry it over by hand.`,
        );
      }
      if (scrollHooks.has(node.expression.text)) uses.scrollLinked = true;
    }
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      context = { ...context, nested: true };
    }

    if (ts.isJsxExpression(node) && node.expression) {
      const map = mapCall(node.expression, context.scope);
      if (map) {
        const { call, target, targetNode } = map;
        if (target.field.kind === "buttons") {
          return blockButtons(target, inner(targetNode, context), "contents");
        }
        const callback = call.arguments[0];
        if (
          (target.field.kind !== "list" && target.field.kind !== "imageList") ||
          !callback ||
          !ts.isArrowFunction(callback) ||
          !callback.parameters.length ||
          !ts.isIdentifier(callback.parameters[0].name)
        ) {
          problems.add(
            `The list "${targetNode.getText()}" is drawn in a way the converter does not know. Carry it over by hand.`,
          );
          return node.getText();
        }
        const itemName = callback.parameters[0].name.text;
        const indexName = callback.parameters[1]?.name.getText();
        const itemPath = `${target.pathCode}[_key=="\${${itemName}._key}"]`;
        const scope = new Map(context.scope);
        scope.set(
          itemName,
          target.field.kind === "imageList"
            ? {
                field: {
                  kind: "image",
                  name: target.field.name,
                  sample: target.field.sample,
                },
                pathCode: itemPath,
              }
            : { item: target.field.item, pathCode: itemPath },
        );
        let body = callback.body;
        while (ts.isParenthesizedExpression(body)) body = body.expression;
        const output = inner(body, {
          ...context,
          item: { field: target.field, index: indexName, name: itemName },
          jsxChild: false,
          nested: true,
          scope,
        });
        const keepIndex =
          indexName && new RegExp(`\\b${indexName}\\b`).test(output);
        const parameters = keepIndex
          ? `(${itemName}, ${indexName})`
          : `(${itemName})`;
        return `{(${inner(targetNode, context)} ?? []).map(${parameters} => (${output}))}`;
      }
    }

    // A nested object can be unset in Studio, so its members are read with
    // optional chaining.
    // A tab's `value` is its item's key (see `tabValue` in model.mjs).
    if (ts.isPropertyAccessExpression(node) && node.name.text === "value") {
      const owner = resolve(node.expression, context.scope);
      if (owner?.item?.tabValue) {
        return `${inner(node.expression, context)}._key`;
      }
      const picked = node.expression;
      const list =
        ts.isElementAccessExpression(picked) &&
        ts.isIdentifier(picked.expression) &&
        ts.isNumericLiteral(picked.argumentExpression)
          ? context.scope.get(picked.expression.text)
          : undefined;
      if (list?.top && list.field.kind === "list" && list.field.item.tabValue) {
        return `${list.field.name}?.[${picked.argumentExpression.text}]?._key`;
      }
    }
    if (ts.isPropertyAccessExpression(node)) {
      const base = resolve(node.expression, context.scope);
      if (base?.field?.kind === "string") {
        problems.add(
          `The component computes with the text of "${node.expression.getText()}" (${node.getText()}). Carry it over by hand.`,
        );
      }
      if (base?.field?.kind === "object") {
        const member = resolve(node, context.scope);
        const name = member?.imagePart
          ? node.name.text
          : (member?.field?.name ?? node.name.text);
        return `${inner(node.expression, context)}?.${name}`;
      }
    }

    // A reference to a renamed field takes the field's new name.
    if (ts.isIdentifier(node) && !ts.isJsxAttribute(node.parent)) {
      const parent = node.parent;
      const namesSomething =
        (ts.isPropertyAssignment(parent) ||
          ts.isVariableDeclaration(parent) ||
          ts.isBindingElement(parent)) &&
        parent.name === node;
      if (ts.isPropertyAccessExpression(parent) && parent.name === node) {
        const binding = resolve(parent, context.scope);
        if (binding?.field?.sourceName === node.text) return binding.field.name;
      } else if (!namesSomething) {
        const binding = context.scope.get(node.text);
        // `{ title }` names a property and reads a value: when the value
        // takes another form the property keeps its name (`{ title: heading }`).
        const named = (value) =>
          ts.isShorthandPropertyAssignment(parent) && value !== node.text
            ? `${node.text}: ${value}`
            : value;
        // A name of a helper component drawn in place stands for what the
        // block passed it.
        if (binding?.code) return named(binding.code);
        if (binding?.top && context.statement) {
          problems.add(
            `The component computes with the field "${node.text}" before its return statement. Carry it over by hand.`,
          );
        }
        if (binding?.top) return named(binding.field.name);
      }
    }

    const children = node.getChildren(sourceFile);
    if (!children.length) return text.slice(node.getStart(), node.end);
    return children
      .map((child, index) =>
        index === 0 ? inner(child, context) : full(child, context),
      )
      .join("");
  }

  const context = { jsxChild: false, scope: topScope };
  const opening = root.openingElement;
  // The <section> element itself can be the tall scroll track of a pinned block.
  const extras = [
    classAttribute(opening, { dropBlockPadding: true }),
    pinned ? unpinClassesFor(opening, new Set()) : "",
  ]
    .filter(Boolean)
    .join(" ");
  const children = childrenOverPhoto(
    [...root.children],
    { ...context, jsxChild: true },
    (child, childContext) => full(child, childContext),
  );
  const scene =
    "blockSceneClassName(resolveBlockTheme(theme), top, bottom)";
  if (extras) uses.cn = true;
  const labelled = uses.headingId ? " aria-labelledby={headingId}" : "";
  // A ref that `useScroll` follows (`target: sectionRef`) but that Relume
  // attached to nothing (Header 143): Motion then follows the page instead
  // and the animation never runs. Its name says what it is for, so a ref
  // named for the section goes on the block's element.
  const looseRef = [...locals].find(
    ([name, initializer]) =>
      /^useRef\b/.test(initializer.getText()) &&
      /section/i.test(name) &&
      new RegExp(`\\btarget:\\s*${name}\\b`).test(componentText) &&
      !new RegExp(`\\bref=\\{${name}\\}`).test(componentText),
  )?.[0];
  const attachedRef = looseRef ? ` ref={${looseRef}}` : "";
  const jsx =
    `<section${labelled}${attachedRef}${attributes(opening, context, ["className"])} className={${extras ? `cn(${scene}, ${JSON.stringify(extras)})` : scene}} data-sanity={dataAttribute?.("theme")}>` +
    children +
    "</section>";

  // State that only a video pop-up's content read (`isIframeLoaded`) has no
  // reader left: BlockVideoDialog keeps its own.
  const helperText = (model.helpers ?? [])
    .map(({ node }) => node.getText())
    .join("\n");
  const isUnreadState = (statement) => {
    if (!uses.video) return false;
    const [declaration] = statement.declarationList.declarations;
    if (
      statement.declarationList.declarations.length !== 1 ||
      !ts.isArrayBindingPattern(declaration.name) ||
      !declaration.initializer ||
      !/^useState\b/.test(declaration.initializer.getText())
    ) {
      return false;
    }
    const others = bodyStatements
      .filter((other) => other !== statement)
      .map((other) => other.getText())
      .join("\n");
    return declaration.name.elements.every(
      (element) =>
        !ts.isBindingElement(element) ||
        !new RegExp(`\\b${element.name.getText()}\\b`).test(
          `${jsx}\n${others}\n${helperText}`,
        ),
    );
  };
  const statements = bodyStatements
    .filter((statement) => !isUnreadState(statement))
    .map((statement) => inner(statement, { ...context, statement: true }));
  // A video field is an editor's link, which only the pop-up can play.
  const allFields = (list) =>
    list.flatMap((field) => [
      field,
      ...(field.item ? allFields(field.item.fields) : []),
    ]);
  for (const field of allFields(fields)) {
    if (field.kind === "video" && !field.drawn) {
      problems.add(
        `"${field.sourceName}" holds a video that the component does not play in a pop-up (a <Dialog> with one <iframe>). Model it by hand.`,
      );
    }
  }
  // `scrollY` from `useScroll({ target })` is still the page's position.
  if (
    /\{[^}]*\bscroll[XY]\b[^}]*\}\s*=\s*useScroll\(\s*\{[^)]*\btarget\b/.test(
      componentText,
    )
  ) {
    problems.add(
      "The component reads the page's scroll position (scrollY or scrollX) from useScroll with a target, so its animation is wrong when the block is not first on the page. Carry it over by hand with scrollYProgress.",
    );
  }
  // Each pinned panel must have been unpinned for reduced motion above.
  const panels = componentText.match(/\bsticky\b/g)?.length ?? 0;
  if (pinned && unpinnedPanels !== panels) {
    problems.add(
      "The Relume component pins content while a scroll animation moves it (sticky), and the converter cannot read the pinned element's classes to unpin it for reduced motion. Carry it over by hand.",
    );
  }

  const helpers = (model.helpers ?? [])
    .filter(({ name }) => !inlinedHelpers.has(name) || keptHelpers.has(name))
    .map(({ name, node }) => {
    // Heading levels follow the block's own headings, and a hero's are
    // variables inside the block, out of a helper's reach.
    if (/<h[1-6]\b/.test(node.getText())) {
      problems.add(
        `The helper component ${name} draws a heading, and the converter numbers headings only in the block itself. Carry it over by hand.`,
      );
    }
    const [parameter] = node.parameters;
    const scope = new Map();
    const propTypes = new Map();
    let type = parameter?.type;
    if (type && ts.isTypeReferenceNode(type)) {
      type = model.aliases.get(type.typeName.getText());
    }
    if (
      node.parameters.length > 1 ||
      (parameter &&
        (!ts.isObjectBindingPattern(parameter.name) ||
          !type ||
          !ts.isTypeLiteralNode(type)))
    ) {
      problems.add(
        `The helper component ${name} takes its props in a way the converter does not know. Carry it over by hand.`,
      );
    } else if (parameter) {
      for (const member of type.members) {
        if (!ts.isPropertySignature(member) || !member.type) continue;
        const propName = member.name.getText();
        const propType = member.type;
        propTypes.set(propName, propType);
        const plain =
          [
            ts.SyntaxKind.StringKeyword,
            ts.SyntaxKind.NumberKeyword,
            ts.SyntaxKind.BooleanKeyword,
          ].includes(propType.kind) ||
          (ts.isUnionTypeNode(propType) &&
            propType.types.every(ts.isLiteralTypeNode));
        if (
          ts.isTypeReferenceNode(propType) &&
          propType.typeName.getText() === "ImageProps"
        ) {
          scope.set(propName, { field: { kind: "image", name: propName } });
        } else if (!plain) {
          problems.add(
            `The helper component ${name} takes "${propName}" of the type ${propType.getText()}, which the converter cannot pass on. Carry it over by hand.`,
          );
        }
      }
    }
    const parameters = text.slice(node.parameters.pos, node.parameters.end);
    return `const ${name} = (${parameters}) => ${inner(node.body, { jsxChild: false, propTypes, scope })};`;
  });

  const buttonRoles = buttonFields.map((field) => ({
    name: field.rolesName,
    code: buttonRolesCode(field),
  }));

  return {
    buttonRoles,
    helpers,
    jsx,
    problems: [...problems],
    statements,
    uses,
  };
}
