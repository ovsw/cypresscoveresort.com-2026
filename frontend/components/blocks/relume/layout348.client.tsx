"use client";

// Hand-finished from relume/source/layout348.tsx (Relume Layout 348), browser
// half. On a desktop each feature fills a screen beside a pinned photo; the
// feature that crosses the middle of the screen shows its own photo there,
// and the ground turns to the quiet fill (`bg-muted`, Relume's scheme
// foreground) for every other feature, the first included. Nothing moves:
// the photo changes in place and the ground fades, so reduced motion needs
// nothing more than an instant fade. On a phone each feature shows its photo
// under its text. Every photo fills a square frame, as in the design, cropped
// to cover it whatever its own shape. Listed under "Hand-finished blocks" in
// docs/agents/relume-import.md; do not regenerate.
import {
  BlockButtons,
  type BlockButtonRole,
} from "@/components/blocks/relume/block-buttons";
import { blockDataAttribute } from "@/components/blocks/relume/block-editing";
import { BlockImage } from "@/components/blocks/relume/block-image";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { stegaClean } from "next-sanity";
import { useEffect, useRef, useState } from "react";
import { resolveBlockTheme, blockSceneClassName } from "../block-boundaries";
import type { RelumeLayout348Props } from "./layout348";

// A button's style comes from its position, as in the Relume original.
const buttonsRoles: BlockButtonRole[] = [
  { variant: "outline" },
  {
    variant: "link",
    iconRight: <ChevronRight aria-hidden="true" className="text-foreground" />,
  },
];

export default function RelumeLayout348Client({
  _key,
  bottom = "outer",
  editing,
  features,
  theme,
  top = "outer",
}: Omit<RelumeLayout348Props, "_type">) {
  const dataAttribute = blockDataAttribute(editing);
  const items = features ?? [];
  const blockId = `relume-layout348-${stegaClean(_key)}`;
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const itemKeys = items.map((feature) => feature._key).join(" ");

  // The feature that crosses the middle of the screen is the open one, at
  // any height (Relume's half-visible threshold misses a feature taller
  // than twice the screen, as on a phone).
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const crossing = entries.find((entry) => entry.isIntersecting);
        if (!crossing) return;
        const index = Number((crossing.target as HTMLElement).dataset.index);
        if (!Number.isNaN(index)) setActiveIndex(index);
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    for (const element of itemRefs.current) {
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [itemKeys]);

  const featurePath = (key: string, field: string) =>
    `features[_key=="${key}"].${field}`;
  const firstHeadingId = `${blockId}-${stegaClean(items[0]?._key)}-heading`;

  return (
    <section
      aria-labelledby={firstHeadingId}
      className={cn(
        blockSceneClassName(resolveBlockTheme(theme), top, bottom),
        "relative isolate",
      )}
      data-sanity={dataAttribute?.("theme")}
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className={cn(
            "h-full bg-muted transition-opacity duration-300 motion-reduce:transition-none md:sticky md:top-0 md:h-screen",
            activeIndex % 2 === 0 ? "opacity-100" : "opacity-0",
          )}
        />
      </div>
      <div className="container">
        <div className="relative grid gap-x-12 sm:gap-y-12 md:grid-cols-2 lg:gap-x-20">
          <div className="sticky top-0 hidden h-screen md:flex md:flex-col md:items-center md:justify-center">
            {items.map((feature, index) => (
              <BlockImage
                className={cn(
                  "absolute aspect-square w-full rounded-card object-cover",
                  activeIndex === index
                    ? "opacity-100"
                    : "pointer-events-none opacity-0",
                )}
                dataSanity={dataAttribute?.(featurePath(feature._key, "image"))}
                image={feature.image}
                key={feature._key}
              />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-12 md:block">
            {items.map((feature, index) => (
              <div
                data-index={index}
                key={feature._key}
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
              >
                <div className="flex flex-col items-start justify-center md:h-screen">
                  {stegaClean(feature.tagline)?.trim() ? (
                    <p
                      className="mb-3 font-semibold md:mb-4"
                      data-sanity={dataAttribute?.(
                        featurePath(feature._key, "tagline"),
                      )}
                    >
                      {feature.tagline}
                    </p>
                  ) : null}
                  <h2
                    className="mb-5 typo-block-heading md:mb-6"
                    data-sanity={dataAttribute?.(
                      featurePath(feature._key, "heading"),
                    )}
                    id={`${blockId}-${stegaClean(feature._key)}-heading`}
                  >
                    {feature.heading}
                  </h2>
                  {stegaClean(feature.description)?.trim() ? (
                    <p
                      className="typo-body-editorial"
                      data-sanity={dataAttribute?.(
                        featurePath(feature._key, "description"),
                      )}
                    >
                      {feature.description}
                    </p>
                  ) : null}
                  <BlockButtons
                    buttons={feature.buttons}
                    className="mt-6 flex flex-wrap items-center gap-4 md:mt-8"
                    dataAttribute={dataAttribute}
                    path={featurePath(feature._key, "buttons")}
                    roles={buttonsRoles}
                  />
                  <div className="mt-10 block w-full md:hidden">
                    <BlockImage
                      className="aspect-square w-full rounded-card object-cover"
                      dataSanity={dataAttribute?.(
                        featurePath(feature._key, "image"),
                      )}
                      image={feature.image}
                      sizes="100vw"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
