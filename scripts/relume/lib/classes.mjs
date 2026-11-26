// Maps the classes of a Relume component (Tailwind 3 + Relume's preset and
// design tokens) to the Starter's Tailwind 4 setup and its tokens in
// frontend/app/globals.css. See docs/agents/relume-import.md, "Class map".

// Relume type scale -> the Starter's typography utilities. The Starter has
// four heading steps for Relume's six, so neighbours share a step.
const typeScale = {
  "text-h1": "typo-feature-heading",
  "text-h2": "typo-block-heading",
  "text-h3": "typo-block-heading",
  "text-h4": "typo-block-subheading",
  "text-h5": "typo-block-subheading",
  "text-h6": "typo-title-minor",
  "text-large": "typo-body-editorial",
  "text-medium": "typo-body-editorial",
  "text-regular": "typo-body",
  "text-small": "typo-body-sm",
  "text-tiny": "typo-fine-print",
};

// Relume's preset replaces Tailwind's font-size scale. Names that mean
// another size in Tailwind 4 become explicit values.
const presetFontSizes = {
  md: ["1.125rem", "1.5"],
  lg: ["1.25rem", "1.5"],
  xl: ["1.25rem", "1.4"],
  "2xl": ["1.5rem", "1.4"],
  "3xl": ["1.75rem", "1.4"],
  "4xl": ["2rem", "1.3"],
  "5xl": ["2.25rem", "1.2"],
  "6xl": ["2.5rem", "1.2"],
  "7xl": ["2.75rem", "1.2"],
  "8xl": ["3rem", "1.2"],
  "9xl": ["3.25rem", "1.2"],
  "10xl": ["3.5rem", "1.2"],
};

// Relume's preset replaces Tailwind's max-width scale.
const presetMaxWidths = {
  xxs: "20rem",
  xs: "25rem",
  sm: "30rem",
  md: "35rem",
  lg: "48rem",
  xl: "64rem",
  xxl: "80rem",
};

const presetShadows = {
  xxsmall: "shadow-xs",
  xsmall: "shadow-sm",
  small: "shadow-md",
  medium: "shadow-lg",
  large: "shadow-xl",
  xlarge: "shadow-2xl",
  xxlarge: "shadow-2xl",
};

// Relume colour schemes -> job tokens.
const schemeTokens = {
  text: "foreground",
  background: "background",
  foreground: "card",
  border: "border",
};

// The older Relume colour names (bg-background-primary, text-text-secondary).
const legacyColours = {
  "background-primary": "background",
  "background-secondary": "muted",
  "background-alternative": "foreground",
  "border-primary": "border",
  "border-secondary": "border-strong",
  "border-alternative": "background",
  "text-primary": "foreground",
  "text-secondary": "muted-foreground",
  "text-alternative": "background",
  "link-primary": "link",
  "link-secondary": "muted-foreground",
  "link-alternative": "background",
};

const radii = {
  image: "card",
  card: "card",
  button: "control",
  form: "control",
  badge: "control",
  checkbox: "control",
  carousel: "card",
  dropdown: "control",
};

// Utilities Tailwind 4 renamed.
const renamed = {
  "shadow-sm": "shadow-xs",
  shadow: "shadow-sm",
  "drop-shadow-sm": "drop-shadow-xs",
  "drop-shadow": "drop-shadow-sm",
  "blur-sm": "blur-xs",
  blur: "blur-sm",
  "backdrop-blur-sm": "backdrop-blur-xs",
  "backdrop-blur": "backdrop-blur-sm",
  "rounded-sm": "rounded-xs",
  rounded: "rounded-sm",
  "outline-none": "outline-hidden",
  ring: "ring-3",
  "flex-shrink-0": "shrink-0",
  "flex-shrink": "shrink",
  "flex-grow-0": "grow-0",
  "flex-grow": "grow",
  "overflow-ellipsis": "text-ellipsis",
};

const colourProperties =
  "text|bg|border|outline|ring|fill|stroke|from|via|to|divide|decoration|accent|caret|shadow";
const palette =
  "white|black|neutral|gray|slate|zinc|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|brand|system";
const tailwind4Animations = new Set([
  "animate-spin",
  "animate-ping",
  "animate-pulse",
  "animate-bounce",
  "animate-in",
  "animate-out",
  "animate-none",
]);
// Relume's preset animations. frontend/app/globals.css defines each one.
export const presetAnimations = new Set(
  [
    "loop-horizontally",
    "loop-testimonials",
    "loop-vertically",
    "loop-vertically-top",
    "loop-vertically-bottom",
    "marquee-horizontally",
    "marquee-top",
    "marquee-right",
    "marquee-bottom",
    "marquee-left",
    "tabs",
  ].map((name) => `animate-${name}`),
);

/** Splits `md:hover:text-h2` into its variant prefix and its utility. */
function splitVariants(token) {
  let depth = 0;
  let cut = 0;
  for (let index = 0; index < token.length; index += 1) {
    const char = token[index];
    if (char === "[" || char === "(") depth += 1;
    else if (char === "]" || char === ")") depth -= 1;
    else if (char === ":" && depth === 0) cut = index + 1;
  }
  return [token.slice(0, cut), token.slice(cut)];
}

// The least opacity of a scrim over a photo. Text in the Dark scene
// (neutral-50) over a black scrim at 60% on a pure white photo is 5.5:1,
// above the 4.5:1 minimum; Relume's usual 50% gives 3.8:1.
export const minimumScrimOpacity = 60;

// Relume's full-viewport heights. A Starter block sits under the site header
// and inside its block padding, so one screen of it is shorter than the
// viewport. See the `--screen-block` tokens in frontend/app/globals.css.
const fullScreenHeight = /^((?:min-|max-)?h)-(screen|svh|dvh|lvh)$/;

// Tailwind's breakpoints, narrowest first. A class without one applies from
// the first; a class with one applies from its breakpoint up, until a class
// of the same property at a wider breakpoint takes over.
const breakpoints = ["", "sm:", "md:", "lg:", "xl:", "2xl:"];
const positionUtilities = new Set([
  "static",
  "relative",
  "absolute",
  "fixed",
  "sticky",
]);

/** The breakpoint a variant prefix starts with, and the variants after it. */
function breakpointOf(variants) {
  const match = /^(sm|md|lg|xl|2xl):/.exec(variants);
  if (!match) return { at: 0, rest: variants };
  return { at: breakpoints.indexOf(`${match[1]}:`), rest: variants.slice(match[0].length) };
}

/** `h`, `min-h` or `max-h` for a height utility, else undefined. */
function heightProperty(utility) {
  return /^!?((?:min-|max-)?h)-/.exec(utility)?.[1];
}

/**
 * One value per breakpoint: what `pick` reads from the last class that sets
 * it at that breakpoint or a narrower one. `pick` returns undefined for a
 * class that does not set it. Classes with other variants (`hover:`,
 * `motion-reduce:`) apply only sometimes and are left out.
 */
function perBreakpoint(tokens, pick) {
  const values = breakpoints.map(() => undefined);
  for (const token of tokens) {
    const value = token.rest ? undefined : pick(token.utility);
    if (value !== undefined) values[token.at] = value;
  }
  for (let index = 1; index < values.length; index += 1) {
    values[index] ??= values[index - 1];
  }
  return values;
}

function mapUtility(utility, problems, { photo, blockRoot, pinned }) {
  const important = utility.startsWith("!") ? "!" : "";
  const negative = utility.slice(important.length).startsWith("-") ? "-" : "";
  const base = utility.slice(important.length + negative.length);
  const wrap = (value) => `${important}${negative}${value}`;

  if (typeScale[base]) return wrap(typeScale[base]);
  if (renamed[base]) return wrap(renamed[base]);

  // A full-screen height fills the screen under the site header: the
  // block's own element (which carries the block padding) takes
  // `--screen-block`, an element inside the padding `--screen-block-content`.
  // A pinned (`sticky`) panel keeps the whole viewport: the header has
  // scrolled away by the time it pins. `pinned` is true only at the
  // breakpoints where the element is sticky (see mapClasses).
  let match = pinned ? null : fullScreenHeight.exec(base);
  if (match) {
    return wrap(
      `${match[1]}-(${blockRoot ? "--screen-block" : "--screen-block-content"})`,
    );
  }

  // A photo behind the whole block: Relume darkens it with a translucent
  // black layer and sets white text over it. The layer is a scrim, at least
  // `minimumScrimOpacity` opaque so the text passes contrast over any
  // photo, and the text layer takes the Dark scene (see render.mjs), where
  // the foreground is light whatever the block's theme.
  match =
    photo === "backdrop" ? /^bg-neutral-darkest\/(\d+)$/.exec(base) : null;
  if (match) {
    return wrap(
      `bg-scrim/${Math.max(Number(match[1]), minimumScrimOpacity)}`,
    );
  }
  // Text over a photo is opaque: the scrim's opacity is worked out for the
  // full foreground colour, and `text-white/50` would fall to about 2.6:1
  // over a white part of the photo.
  if (photo === "foreground" && /^text-white(\/\d+)?$/.test(base)) {
    return wrap("text-foreground");
  }
  // A white rule over a photo (Stats 4's divider) is the Dark scene's
  // foreground too.
  if (photo === "foreground" && base === "border-white") {
    return wrap("border-foreground");
  }

  // Relume's foreground ground sets a panel apart from the section ground.
  // The Starter's `card` is the section's own white on the Light theme, so
  // that panel would vanish; `muted` differs from the ground on both themes,
  // as the hand-finished layout348 and layout488 draw it. Other properties
  // (text, border) keep the card's colours.
  match = /^bg-scheme-foreground(\/.+)?$/.exec(base);
  if (match) return wrap(`bg-muted${match[1] ?? ""}`);
  match = new RegExp(
    `^(${colourProperties})-scheme-(text|background|foreground|border)(/.+)?$`,
  ).exec(base);
  if (match)
    return wrap(`${match[1]}-${schemeTokens[match[2]]}${match[3] ?? ""}`);
  // The colour of one side of a border: `border-t-scheme-border`.
  match = /^border-([trblxyse])-scheme-(text|background|foreground|border)(\/.+)?$/.exec(
    base,
  );
  if (match)
    return wrap(`border-${match[1]}-${schemeTokens[match[2]]}${match[3] ?? ""}`);

  match = new RegExp(
    `^(${colourProperties})-((?:background|border|text|link)-(?:primary|secondary|alternative))(/.+)?$`,
  ).exec(base);
  if (match)
    return wrap(`${match[1]}-${legacyColours[match[2]]}${match[3] ?? ""}`);

  match =
    /^rounded(-(?:[trbl]{1,2}|[se]{1,2}))?-(image|card|button|form|badge|checkbox|carousel|dropdown)$/.exec(
      base,
    );
  if (match) return wrap(`rounded${match[1] ?? ""}-${radii[match[2]]}`);

  match = /^max-w-(xxs|xs|sm|md|lg|xl|xxl)$/.exec(base);
  if (match) return wrap(`max-w-[${presetMaxWidths[match[1]]}]`);

  match = /^text-(md|lg|xl|[2-9]xl|10xl)$/.exec(base);
  if (match) {
    const [size, lineHeight] = presetFontSizes[match[1]];
    return wrap(`text-[${size}]/[${lineHeight}]`);
  }

  match = /^shadow-(xxsmall|xsmall|small|medium|large|xlarge|xxlarge)$/.exec(
    base,
  );
  if (match) return wrap(presetShadows[match[1]]);

  if (
    new RegExp(`^(${colourProperties})-(${palette})(-[a-z0-9-]+)?(/.+)?$`).test(
      base,
    )
  ) {
    problems.add(
      `"${base}" is a palette colour. Blocks use job tokens only (see "Colour" in docs/agents/page-builder.md).`,
    );
  } else if (
    new RegExp(
      `^(${colourProperties})-\\[(#|rgb|hsl|hwb|lab|lch|oklab|oklch|color)`,
    ).test(base)
  ) {
    problems.add(
      `"${base}" is a fixed colour. Blocks use job tokens only (see "Colour" in docs/agents/page-builder.md).`,
    );
  } else if (/scheme/.test(base)) {
    problems.add(`"${base}" is a Relume scheme class with no mapping yet.`);
  } else if (
    base.startsWith("animate-") &&
    !tailwind4Animations.has(base) &&
    !presetAnimations.has(base)
  ) {
    problems.add(
      `"${base}" is an animation the Starter does not define. Add it to frontend/app/globals.css and to presetAnimations first.`,
    );
  }
  return utility;
}

/**
 * Maps one class list. Returns the new list and the classes that need a
 * person's or an agent's decision. `photo` says where the list sits in a
 * block drawn over a photo: in the `"backdrop"` layer that holds the photo
 * and its scrim, or in a `"foreground"` layer over it. `dropBlockPadding`
 * marks the block's own element, which carries the block padding.
 * `dropSectionPadding` marks the element inside it that carries Relume's
 * section padding in its place (see `sectionPaddingElement` in render.mjs),
 * still inside the block padding: `"all"` drops that padding, `"top"` keeps
 * its bottom padding (`py-16` becomes `pb-16`), the space before the content
 * that follows it.
 */
/**
 * Whether a Relume class list carries a section's padding: Relume's side
 * padding (`px-[5%]`) with a vertical padding (`py-16`, `md:pt-24`).
 */
export function hasSectionPadding(classList) {
  const utilities = classList
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => splitVariants(token)[1]);
  return (
    utilities.includes("px-[5%]") &&
    utilities.some((utility) => /^p[ytb]-\d+$/.test(utility))
  );
}

export function mapClasses(
  classList,
  { dropBlockPadding = false, dropSectionPadding, photo } = {},
) {
  const problems = new Set();
  const tokens = classList
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const [relumeVariants, utility] = splitVariants(token);
      // Relume's widest breakpoint is `xxl`; Tailwind 4 calls it `2xl`.
      const variants = relumeVariants.replace(/(^|:)xxl:/g, "$12xl:");
      return { variants, utility, ...breakpointOf(variants) };
    });
  const hasHeadingStep = tokens.some(({ utility }) =>
    /^text-h[1-6]$/.test(utility),
  );
  // Where the element is pinned (`sticky`): `lg:sticky` pins it from `lg`
  // up only. A `sticky` that applies only sometimes (`hover:sticky`) counts
  // from its breakpoint up, as the safe side.
  const pinnedAt = perBreakpoint(tokens, (utility) =>
    positionUtilities.has(utility) ? utility === "sticky" : undefined,
  ).map(Boolean);
  for (const { at, rest, utility } of tokens) {
    if (rest && utility === "sticky") pinnedAt.fill(true, at);
  }
  const options = { photo, blockRoot: dropBlockPadding };
  // Where the element fills the screen: a full-screen height or minimum
  // height. A maximum height (`max-h-svh`) only caps it.
  const fills = (property) =>
    perBreakpoint(tokens, (utility) =>
      heightProperty(utility) === property
        ? fullScreenHeight.test(utility.replace(/^!/, ""))
        : undefined,
    );
  const fillsHeight = fills("h");
  const fillsMinHeight = fills("min-h");
  // Relume puts a full-screen block's vertical padding on its full-screen
  // element, inside the section. The block padding gives that space here,
  // so the element drops it, as the section does: only when it fills the
  // screen, unpinned, at every width.
  const fullScreenInside =
    !dropBlockPadding &&
    breakpoints.every(
      (_, index) =>
        (fillsHeight[index] || fillsMinHeight[index]) && !pinnedAt[index],
    );
  const mapped = tokens.flatMap(({ variants, utility, at, rest }) => {
    // The Starter's typography utilities set the heading weight.
    if (hasHeadingStep && /^font-(bold|semibold)$/.test(utility)) return [];
    if (dropSectionPadding === "top") {
      if (utility === "px-[5%]" || /^pt-\d+$/.test(utility)) return [];
      if (/^py-\d+$/.test(utility)) {
        return [`${variants}${utility.replace(/^py-/, "pb-")}`];
      }
    }
    if (
      (dropBlockPadding || dropSectionPadding === "all") &&
      (utility === "px-[5%]" || /^p[ytb]-\d+$/.test(utility))
    ) {
      // blockSceneClassName owns the block's vertical padding and the
      // `container` utility owns its side padding.
      return [];
    }
    if (fullScreenInside && /^p[ytb]-\d+$/.test(utility)) return [];
    const property = heightProperty(utility);
    if (property && fullScreenHeight.test(utility.replace(/^!/, ""))) {
      // A full-screen height applies from its breakpoint until a wider
      // class of the same property. Where the element is pinned in that
      // span it keeps the whole viewport, elsewhere it takes the screen
      // under the header, so `h-svh lg:sticky` becomes
      // `h-(--screen-block-content) lg:h-svh`.
      const until = Math.min(
        ...tokens
          .filter(
            (other) =>
              !other.rest &&
              other.at > at &&
              heightProperty(other.utility) === property,
          )
          .map((other) => other.at),
        breakpoints.length,
      );
      const out = [];
      for (let index = at; index < until; index += 1) {
        if (index > at && pinnedAt[index] === pinnedAt[index - 1]) continue;
        const prefix = index === at ? variants : `${breakpoints[index]}${rest}`;
        out.push(
          `${prefix}${mapUtility(utility, problems, { ...options, pinned: pinnedAt[index] })}`,
        );
      }
      return out;
    }
    return [`${variants}${mapUtility(utility, problems, options)}`];
  });
  return { classes: mapped.join(" "), problems: [...problems] };
}
