"use client";

// Hand-finished with layout487.tsx (listed under "Hand-finished blocks" in
// docs/agents/relume-import.md): the browser half of Layout 487. As in the
// Relume original, on a tablet or desktop a tall photo stays pinned in the
// middle column while the features scroll past, the first on the left, the
// second half a screen lower on the right, and so on. Each feature fades in
// as it nears the middle of the screen and out as it leaves, and the pinned
// photo shows the image of the feature last faded in. On a phone the features
// are one column, each with its own image above it, and nothing fades.
//
// Relume draws each feature twice (in one column on a phone, in two on a
// desktop) and swaps the photo's source. Here each feature is drawn once and
// placed by CSS: a grid of half-screen rows, each feature two rows tall, in
// the left or right column by its place in the list. The pinned frame holds
// every image and fades between them. With reduced motion nothing fades or
// is pinned: the frame is not drawn, and the features stand in three columns
// with their own images, as on a phone.
import {
  BlockButtons,
  type BlockButtonRole,
} from "@/components/blocks/relume/block-buttons";
import { blockDataAttribute } from "@/components/blocks/relume/block-editing";
import { BlockImage } from "@/components/blocks/relume/block-image";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import {
  MotionConfig,
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "motion/react";
import { stegaClean } from "next-sanity";
import { type CSSProperties, useRef, useState } from "react";
import { resolveBlockTheme, blockSceneClassName } from "../block-boundaries";
import type { RelumeLayout487Props } from "./layout487";

type Feature = NonNullable<RelumeLayout487Props["features"]>[number];

// A button's style comes from its position, as in the Relume original.
const buttonsRoles: BlockButtonRole[] = [
  { variant: "outline" },
  {
    variant: "link",
    iconRight: <ChevronRight aria-hidden="true" className="text-foreground" />,
  },
];

export default function RelumeLayout487Client({
  _key,
  bottom = "outer",
  editing,
  tagline,
  heading,
  description,
  features,
  theme,
  top = "outer",
}: Omit<RelumeLayout487Props, "_type">) {
  const dataAttribute = blockDataAttribute(editing);
  const headingId = `relume-layout487-${stegaClean(_key)}-heading`;
  const [activeIndex, setActiveIndex] = useState(0);
  // Studio requires each feature's heading; a feature written through the
  // API without one is left out.
  const items = (features ?? []).filter((item) =>
    stegaClean(item.heading)?.trim(),
  );

  return (
    <MotionConfig reducedMotion="user">
      <section
        aria-labelledby={headingId}
        className={blockSceneClassName(resolveBlockTheme(theme), top, bottom)}
        data-sanity={dataAttribute?.("theme")}
      >
        <div className="container">
          <div className="mx-auto max-w-[48rem] text-center">
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
            <div className="mt-12 grid grid-cols-1 items-start md:mt-0 md:grid-cols-3 md:gap-x-8 lg:gap-x-12 motion-reduce:md:mt-16!">
              <div
                className="flex flex-col gap-12 md:col-span-full md:row-start-1 md:grid md:auto-rows-[50vh] md:grid-cols-subgrid md:gap-y-0 md:pt-[60vh] motion-reduce:md:auto-rows-auto! motion-reduce:md:gap-y-16! motion-reduce:md:pt-0!"
                data-sanity={dataAttribute?.("features")}
              >
                {items.map((item, index) => (
                  <Layout487Feature
                    dataAttribute={dataAttribute}
                    index={index}
                    item={item}
                    key={item._key}
                    onShown={setActiveIndex}
                  />
                ))}
              </div>
              <div className="sticky top-0 hidden h-screen w-full items-center justify-center md:col-start-2 md:row-start-1 md:flex motion-reduce:md:hidden!">
                <div className="relative aspect-[2/3] w-full">
                  {items.map((item, index) => {
                    const active = index === activeIndex;
                    return (
                      <div
                        aria-hidden={active ? undefined : true}
                        className={cn(
                          "absolute inset-0 transition-opacity duration-300 motion-reduce:transition-none!",
                          active
                            ? "opacity-100"
                            : "pointer-events-none opacity-0",
                        )}
                        key={item._key}
                      >
                        <BlockImage
                          className="size-full rounded-card object-cover"
                          dataSanity={dataAttribute?.(
                            `features[_key=="${item._key}"].image`,
                          )}
                          image={item.image}
                          sizes="(min-width: 768px) 33vw, 100vw"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </MotionConfig>
  );
}

// One feature, with its own scroll position: a component of its own, so its
// hooks are not called in a loop.
function Layout487Feature({
  dataAttribute,
  index,
  item,
  onShown,
}: {
  dataAttribute?: (path: string) => string | undefined;
  index: number;
  item: Feature;
  onShown: (index: number) => void;
}) {
  const itemPath = `features[_key=="${item._key}"]`;
  // Wide screens only, as in Relume: false on the server, so the features
  // are drawn without the fade until the page has hydrated.
  const isWide = useMediaQuery("(min-width: 768px)");
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.33, 0.5, 0.66, 0.83],
    [0, 0, 1, 1, 0],
  );
  useMotionValueEvent(opacity, "change", (value) => {
    if (isWide && value > 0.5) onShown(index);
  });

  return (
    <div
      className={cn(
        "md:[grid-row:var(--feature-row)/span_2] motion-reduce:md:[grid-row:auto]! motion-reduce:md:col-start-auto!",
        index % 2 === 0 ? "md:col-start-1" : "md:col-start-3",
      )}
      style={{ "--feature-row": index + 1 } as CSSProperties}
    >
      <motion.div
        className="flex flex-col items-start justify-center md:justify-start focus-within:opacity-100! motion-reduce:opacity-100!"
        ref={ref}
        style={isWide ? { opacity } : undefined}
      >
        <div className="mb-8 w-full md:hidden motion-reduce:md:block!">
          <BlockImage
            className="w-full rounded-card"
            dataSanity={dataAttribute?.(`${itemPath}.image`)}
            image={item.image}
          />
        </div>
        {stegaClean(item.tagline)?.trim() ? (
          <p
            className="mb-3 font-semibold md:mb-4"
            data-sanity={dataAttribute?.(`${itemPath}.tagline`)}
          >
            {item.tagline}
          </p>
        ) : null}
        <h3
          className="mb-5 typo-block-subheading md:mb-6"
          data-sanity={dataAttribute?.(`${itemPath}.heading`)}
        >
          {item.heading}
        </h3>
        {stegaClean(item.description)?.trim() ? (
          <p
            className="typo-body-editorial"
            data-sanity={dataAttribute?.(`${itemPath}.description`)}
          >
            {item.description}
          </p>
        ) : null}
        <BlockButtons
          buttons={item.buttons}
          className="mt-6 flex items-center gap-x-4 md:mt-8"
          dataAttribute={dataAttribute}
          path={`${itemPath}.buttons`}
          roles={buttonsRoles}
        />
      </motion.div>
    </div>
  );
}
