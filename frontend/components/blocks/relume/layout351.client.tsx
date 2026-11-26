"use client";

// Hand-finished with layout351.tsx (listed under "Hand-finished blocks" in
// docs/agents/relume-import.md): the browser half of Layout 351. As in the
// Relume original, one feature is open at a time, the first to start with,
// and a click on another opens it. On a desktop the features are columns in
// one card: a closed one is a narrow strip with its number at the top and its
// label read upwards, the open one takes the rest of the width. On a phone
// they are rows, and the open one shows its content under its row.
//
// Relume animates a width and a height with Motion, and reads the screen
// width to pick one. Here CSS does both (the open column's flex-grow, the
// open row's grid track), so the server draws the right form for every
// screen and reduced motion only has to switch the transitions off: the
// features still open on a click, at once.
import { blockDataAttribute } from "@/components/blocks/relume/block-editing";
import { BlockImage } from "@/components/blocks/relume/block-image";
import { cn } from "@/lib/utils";
import { stegaClean } from "next-sanity";
import { useState } from "react";
import { resolveBlockTheme, blockSceneClassName } from "../block-boundaries";
import type { RelumeLayout351Props } from "./layout351";

export default function RelumeLayout351Client({
  _key,
  bottom = "outer",
  editing,
  tagline,
  heading,
  description,
  features,
  theme,
  top = "outer",
}: Omit<RelumeLayout351Props, "_type">) {
  const dataAttribute = blockDataAttribute(editing);
  const blockId = `relume-layout351-${stegaClean(_key)}`;
  const headingId = `${blockId}-heading`;
  const [activeIndex, setActiveIndex] = useState(0);
  // Studio requires each feature's label and heading; a feature written
  // through the API without them is left out.
  const items = (features ?? []).filter(
    (item) => stegaClean(item.label)?.trim() && stegaClean(item.heading)?.trim(),
  );
  // A feature removed while the page is previewed must not leave none open.
  const openIndex = activeIndex < items.length ? activeIndex : 0;

  return (
    <section
      aria-labelledby={headingId}
      className={blockSceneClassName(resolveBlockTheme(theme), top, bottom)}
      data-sanity={dataAttribute?.("theme")}
    >
      <div className="container">
        <div className="mb-12 w-full max-w-[48rem] md:mb-18 lg:mb-20">
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
              className="typo-body-editorial"
              data-sanity={dataAttribute?.("description")}
            >
              {description}
            </p>
          ) : null}
        </div>
        {items.length ? (
          <div
            className="flex w-full flex-col overflow-hidden rounded-card border border-border bg-card text-card-foreground lg:h-[90vh] lg:flex-row"
            data-sanity={dataAttribute?.("features")}
          >
            {items.map((item, index) => {
              const open = index === openIndex;
              const itemPath = `features[_key=="${item._key}"]`;
              const itemId = `${blockId}-${stegaClean(item._key)}`;
              return (
                <div
                  key={item._key}
                  className={cn(
                    "flex flex-col overflow-hidden border-b border-border last:border-b-0 lg:min-w-20 lg:shrink-0 lg:basis-20 lg:flex-row lg:border-r lg:border-b-0 lg:transition-[flex-grow] lg:duration-300 lg:ease-in-out lg:last:border-r-0 motion-reduce:transition-none!",
                    open ? "lg:grow" : "lg:grow-0",
                  )}
                >
                  <button
                    aria-controls={`${itemId}-panel`}
                    aria-expanded={open}
                    className="relative flex h-16 w-full shrink-0 cursor-pointer items-center justify-center px-16 py-8 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset md:h-20 md:px-20 lg:h-full lg:w-20 lg:flex-col lg:justify-between lg:px-0"
                    id={`${itemId}-button`}
                    onClick={() => setActiveIndex(index)}
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute left-6 typo-block-subheading whitespace-nowrap md:left-10 lg:static"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className="typo-block-subheading lg:rotate-180 lg:whitespace-nowrap lg:[writing-mode:vertical-rl]"
                      data-sanity={dataAttribute?.(`${itemPath}.label`)}
                    >
                      {item.label}
                    </span>
                  </button>
                  <div
                    aria-labelledby={`${itemId}-button`}
                    className={cn(
                      "grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none! lg:min-w-0 lg:flex-1 lg:grid-rows-[1fr] lg:transition-none",
                      open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                    id={`${itemId}-panel`}
                    inert={!open}
                    role="region"
                  >
                    {/* Scrolls on large screens, so keyboard users must be
                        able to focus it to scroll. A closed panel is inert. */}
                    <div
                      className="min-h-0 overflow-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset lg:overflow-y-auto"
                      tabIndex={0}
                    >
                      <div className="flex flex-col px-6 pt-4 pb-8 md:px-10 md:pt-12 md:pb-12 lg:w-[40rem] lg:px-12 lg:pt-16 lg:pb-16">
                        <h3
                          className="mb-5 typo-block-heading md:mb-6"
                          data-sanity={dataAttribute?.(`${itemPath}.heading`)}
                        >
                          {item.heading}
                        </h3>
                        {stegaClean(item.description)?.trim() ? (
                          <p
                            className="typo-body-editorial"
                            data-sanity={dataAttribute?.(
                              `${itemPath}.description`,
                            )}
                          >
                            {item.description}
                          </p>
                        ) : null}
                        <div className="mt-8 h-80 md:mt-10 md:h-[25rem] lg:mt-12">
                          <BlockImage
                            className="size-full rounded-card object-cover"
                            dataSanity={dataAttribute?.(`${itemPath}.image`)}
                            image={item.image}
                            sizes="(min-width: 1024px) 40rem, 100vw"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
