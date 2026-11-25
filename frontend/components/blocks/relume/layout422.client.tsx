"use client";

// Hand-finished with layout422.tsx (listed under "Hand-finished blocks" in
// docs/agents/relume-import.md): the browser half of Layout 422. As in the
// Relume original, on a desktop the panel under the pointer widens, darkens,
// and slides up its description and link; below the desktop width both are
// always shown. The panel opens on keyboard focus too, and its text stays in
// the page while closed (Relume unmounts it), so the link can be reached and
// read. With reduced motion the panels keep their width and are always open.
import { blockDataAttribute } from "@/components/blocks/relume/block-editing";
import { BlockImage } from "@/components/blocks/relume/block-image";
import { Button } from "@/components/ui/button";
import { getSafeLinkHref } from "@/lib/safe-href";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { MotionConfig, motion } from "motion/react";
import { stegaClean } from "next-sanity";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { resolveBlockTheme, blockSceneClassName } from "../block-boundaries";
import type { RelumeLayout422Props } from "./layout422";

// Relume's `slideVariants`: the description and link grow in from below.
const slideVariants = {
  hidden: { opacity: 0, height: 0, y: 50 },
  visible: { opacity: 1, height: "auto", y: 0 },
};

type Feature = NonNullable<RelumeLayout422Props["features"]>[number];

export default function RelumeLayout422Client({
  _key,
  bottom = "outer",
  description,
  editing,
  features,
  heading,
  tagline,
  theme,
  top = "outer",
}: Omit<RelumeLayout422Props, "_type">) {
  const dataAttribute = blockDataAttribute(editing);
  const headingId = `relume-layout422-${stegaClean(_key)}-heading`;
  const [openKey, setOpenKey] = useState<string | null>(null);
  // Studio requires each panel's heading; a panel written through the API
  // without it is left out.
  const panels = (features ?? []).filter((feature) =>
    stegaClean(feature.heading)?.trim(),
  );

  return (
    <MotionConfig reducedMotion="user">
      <section
        aria-labelledby={headingId}
        className={blockSceneClassName(resolveBlockTheme(theme), top, bottom)}
        data-sanity={dataAttribute?.("theme")}
      >
        <div className="container">
          <div className="mx-auto mb-12 w-full max-w-[48rem] text-center md:mb-18 lg:mb-20">
            {stegaClean(tagline)?.trim() ? (
              <p
                className="mb-3 font-semibold md:mb-4"
                data-sanity={dataAttribute?.("tagline")}
              >
                {tagline}
              </p>
            ) : null}
            <h2
              className="mb-5 typo-block-heading md:mb-6"
              data-sanity={dataAttribute?.("heading")}
              id={headingId}
            >
              {heading}
            </h2>
            {stegaClean(description)?.trim() ? (
              <p
                className="typo-body-editorial whitespace-pre-line"
                data-sanity={dataAttribute?.("description")}
              >
                {description}
              </p>
            ) : null}
          </div>
          <ul
            className="flex flex-col justify-between gap-6 md:flex-row md:gap-8"
            data-sanity={dataAttribute?.("features")}
          >
            {panels.map((feature) => {
              const open = openKey === feature._key;
              return (
                <li
                  className={cn(
                    // min-w-0: the desktop text keeps its fixed width while
                    // closed, and must not hold the panel open.
                    "flex w-full min-w-0 md:w-1/2 lg:transition-all lg:duration-200 motion-reduce:transition-none",
                    open && "lg:w-[70%]",
                    "motion-reduce:lg:w-1/2!",
                  )}
                  key={feature._key}
                  onMouseEnter={() => setOpenKey(feature._key)}
                  onMouseLeave={() =>
                    setOpenKey((key) => (key === feature._key ? null : key))
                  }
                >
                  <Panel
                    dataAttribute={dataAttribute}
                    feature={feature}
                    onFocusChange={(focused) =>
                      setOpenKey((key) =>
                        focused
                          ? feature._key
                          : key === feature._key
                            ? null
                            : key,
                      )
                    }
                    open={open}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </MotionConfig>
  );
}

function Panel({
  dataAttribute,
  feature,
  onFocusChange,
  open,
}: {
  dataAttribute?: (path: string) => string | undefined;
  feature: Feature;
  onFocusChange: (focused: boolean) => void;
  open: boolean;
}) {
  const path = `features[_key=="${feature._key}"]`;
  const button = feature.buttons?.[0];
  const href = getSafeLinkHref(button?.href);
  const label = stegaClean(button?.text)?.trim();
  const link = href && label ? { href, label } : null;
  const newTab = Boolean(stegaClean(button?.openInNewTab));
  const hasDescription = Boolean(stegaClean(feature.description)?.trim());

  // The description and the link's label, drawn twice as in the original:
  // always shown below the desktop width, and sliding in on a desktop.
  const details = (
    <>
      {hasDescription ? (
        <p
          className="mt-5 whitespace-pre-line md:mt-6"
          data-sanity={dataAttribute?.(`${path}.description`)}
        >
          {feature.description}
        </p>
      ) : null}
      {link ? (
        <div className="mt-6 md:mt-8">
          {/* The whole panel is the link, so its label is drawn as
              Relume's link-style button, not as a second link inside it. */}
          <Button asChild className="px-0" variant="link">
            <span data-sanity={dataAttribute?.(`${path}.buttons`)}>
              {link.label}
              <ChevronRight aria-hidden="true" />
            </span>
          </Button>
        </div>
      ) : null}
    </>
  );

  const content: ReactNode = (
    <>
      {/* The photo, under a scrim that keeps the text readable on any
          theme. */}
      <div className="absolute inset-0">
        <BlockImage
          className="size-full object-cover"
          dataSanity={dataAttribute?.(`${path}.image`)}
          image={feature.image}
          sizes="(min-width: 1024px) 70vw, (min-width: 768px) 50vw, 100vw"
        />
        <div className="pointer-events-none absolute inset-0 bg-scrim/60" />
      </div>
      <div className="relative flex h-full min-h-[70vh] flex-col justify-end p-6 text-foreground block-scene-dark md:p-8 lg:p-12">
        <div
          className={cn(
            "pointer-events-none lg:absolute lg:inset-0 lg:z-0 lg:transition-colors lg:duration-300 motion-reduce:transition-none",
            open && "lg:bg-scrim/50",
          )}
        />
        <div className="z-10">
          {stegaClean(feature.tagline)?.trim() ? (
            <p
              className="mb-2 font-semibold"
              data-sanity={dataAttribute?.(`${path}.tagline`)}
            >
              {feature.tagline}
            </p>
          ) : null}
          <h3
            className="typo-block-heading"
            data-sanity={dataAttribute?.(`${path}.heading`)}
          >
            {feature.heading}
          </h3>
          <div className="lg:hidden">{details}</div>
        </div>
        {hasDescription || link ? (
          <motion.div
            animate={open ? "visible" : "hidden"}
            className="z-10 hidden overflow-hidden lg:block lg:w-full lg:max-w-[528px] motion-reduce:h-auto! motion-reduce:opacity-100! motion-reduce:transform-none!"
            initial={false}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            variants={slideVariants}
          >
            {details}
          </motion.div>
        ) : null}
      </div>
    </>
  );

  const panelClassName =
    "relative flex w-full min-w-0 flex-col overflow-hidden rounded-card";

  const focusRingClassName =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  if (!link) {
    if (!hasDescription) return <div className={panelClassName}>{content}</div>;
    // No link to focus, so the panel itself takes focus: a keyboard user
    // opens its description on a desktop as a pointer user does by hovering.
    return (
      <div
        className={cn(panelClassName, focusRingClassName)}
        onBlur={() => onFocusChange(false)}
        onFocus={() => onFocusChange(true)}
        tabIndex={0}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      className={cn(panelClassName, focusRingClassName)}
      href={link.href}
      onBlur={() => onFocusChange(false)}
      onFocus={() => onFocusChange(true)}
      rel={newTab ? "noopener noreferrer" : undefined}
      target={newTab ? "_blank" : undefined}
    >
      {content}
    </Link>
  );
}
