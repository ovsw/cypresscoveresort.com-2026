"use client";

// Hand-finished with layout488.tsx (listed under "Hand-finished blocks" in
// docs/agents/relume-import.md): the browser half of Layout 488. As in the
// Relume original, the block pins one screen for a second screen of scroll.
// Over the first 60% the photo grows from a dot (a fifth of its size; 70%
// on a phone) and the two halves of the heading slide in from the photo
// towards their places; over the rest a circle widens from behind the photo
// until it fills the screen. Relume fills the circle with a flat colour; here
// it is a window onto the block's background photo: a copy of the whole
// screen (the photo under a Dark-scene layer, the heading in the Dark
// foreground, the round photo)
// clipped to the circle, so the heading stays readable as the circle passes
// over it. With reduced motion the screen is not pinned, the photo and
// heading rest where they end, and the circle, which is decoration, is not
// drawn.
import { blockDataAttribute } from "@/components/blocks/relume/block-editing";
import {
  BlockImage,
  hasBlockImage,
} from "@/components/blocks/relume/block-image";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import {
  MotionConfig,
  type MotionValue,
  motion,
  useMotionTemplate,
  useScroll,
  useTransform,
} from "motion/react";
import { stegaClean } from "next-sanity";
import { useRef } from "react";
import { resolveBlockTheme, blockSceneClassName } from "../block-boundaries";
import type { RelumeLayout488Props } from "./layout488";

// The two halves of the heading on a desktop.
// Relume sizes the side tracks at 40% each and keeps each half on one line,
// which overflows the block beside a full-size photo on a tablet. Here the
// side tracks share what the photo leaves, and each half is a size container
// so its type can follow the room it has.
const headingPartClassName =
  "@container relative z-10 hidden justify-self-stretch leading-[1.2] font-bold md:flex motion-reduce:transform-none!";
// Each half's type follows its own length: as large as the screen allows (up
// to 6rem) for a word or two, and smaller for a longer phrase, so that it
// holds to about three lines of its side (300cqi; a character in bold, with
// the room lost at word breaks, takes about 0.7em) instead of wrapping word
// by word. Never below 2rem.
const headingTextClassName =
  "text-[max(2rem,min(clamp(2.5rem,7vw,6rem),calc(300cqi/(var(--heading-chars)*0.7))))]";

export default function RelumeLayout488Client({
  _key,
  bottom = "outer",
  editing,
  headingStart,
  image,
  headingEnd,
  backgroundImage,
  theme,
  top = "outer",
}: Omit<RelumeLayout488Props, "_type">) {
  const dataAttribute = blockDataAttribute(editing);
  const headingId = `relume-layout488-${stegaClean(_key)}-heading`;
  const isMobile = useMediaQuery("(max-width: 767px)");
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const startX = useTransform(scrollYProgress, [0, 0.6], ["10rem", "0rem"]);
  const endX = useTransform(scrollYProgress, [0, 0.6], ["-10rem", "0rem"]);
  const imageScale = useTransform(
    scrollYProgress,
    [0, 0.6],
    isMobile ? [0.7, 1] : [0.2, 1],
  );
  // The circle starts at the round photo's own size, hidden behind it, and
  // widens until it covers the screen's corners (75vmax past the photo's
  // edge). It is not drawn before the photo has grown to full size.
  const circleGrowth = useTransform(scrollYProgress, [0.6, 1], [0, 75]);
  const circleShown = useTransform(scrollYProgress, [0.599, 0.6], [0, 1]);
  const circleClip = useMotionTemplate`circle(calc(min(12rem, 14vw) + ${circleGrowth}vmax) at 50% 50%)`;

  // One screen of the block: the heading's halves around the round photo,
  // and on a phone the whole heading under it. Drawn twice: as the page, and
  // inside the circle, as a Dark scene over the background photo.
  const screen = (revealed: boolean) => {
    const edit = revealed ? () => undefined : dataAttribute;
    return (
      <div
        // The page's screen fills the pinned view and takes every click, so it
        // carries the background photo for click-to-edit: a click on an empty
        // part of the block opens the photo, a click on text or the round
        // photo opens that field.
        data-sanity={edit?.("backgroundImage")}
        className={cn(
          "grid h-full grid-cols-[60%] content-center items-center justify-center justify-items-center gap-4 px-[5%] md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-8 motion-reduce:h-auto!",
        )}
      >
        <HeadingPart
          className="justify-end text-end"
          dataSanity={edit?.("headingStart")}
          text={headingStart}
          x={startX}
        />
        <motion.div
          className="relative order-first flex w-full max-w-[24rem] min-w-16 items-center justify-center md:order-none md:w-[min(24rem,28vw)] motion-reduce:transform-none!"
          style={{ scale: imageScale }}
        >
          <BlockImage
            className="aspect-square size-full rounded-full object-cover"
            dataSanity={edit?.("image")}
            image={image}
            sizes="(min-width: 768px) 24rem, 60vw"
          />
        </motion.div>
        <HeadingPart
          className="justify-start"
          dataSanity={edit?.("headingEnd")}
          text={headingEnd}
          x={endX}
        />
        <p
          aria-hidden="true"
          className="relative z-10 mt-10 w-[90vw] text-center typo-block-heading md:hidden"
        >
          <span data-sanity={edit?.("headingStart")}>{headingStart}</span>{" "}
          <span data-sanity={edit?.("headingEnd")}>{headingEnd}</span>
        </p>
      </div>
    );
  };

  return (
    <MotionConfig reducedMotion="user">
      <section
        aria-labelledby={headingId}
        ref={sectionRef}
        className={cn(
          blockSceneClassName(resolveBlockTheme(theme), top, bottom),
          "relative h-[200vh] motion-reduce:h-auto!",
        )}
        data-sanity={dataAttribute?.("theme")}
      >
        {/* The heading is drawn in parts around the photo, so screen readers
            get it whole, once. */}
        <h2 className="sr-only" id={headingId}>
          {headingStart} {headingEnd}
        </h2>
        <div className="sticky top-0 h-svh overflow-hidden lg:h-screen motion-reduce:static! motion-reduce:h-auto!">
          {screen(false)}
          <motion.div
            aria-hidden="true"
            className="block-scene-dark pointer-events-none absolute inset-0 z-20 text-foreground motion-reduce:hidden"
            style={{ clipPath: circleClip, opacity: circleShown }}
          >
            {hasBlockImage(backgroundImage) ? (
              <BlockImage
                className="absolute inset-0 h-full w-full object-cover"
                image={backgroundImage}
                sizes="100vw"
              />
            ) : null}
            {/* Inside the circle the scene is Dark: the photo sits under the
                Dark ground at half strength, and the heading takes the Dark
                foreground, so it stays readable over any photo. */}
            <div className="absolute inset-0 bg-background/55" />
            <div className="absolute inset-0">{screen(true)}</div>
          </motion.div>
        </div>
      </section>
    </MotionConfig>
  );
}

// One half of the heading on a desktop, sliding in from the photo.
function HeadingPart({
  className,
  dataSanity,
  text,
  x,
}: {
  className: string;
  dataSanity?: string;
  text?: string | null;
  x: MotionValue<string>;
}) {
  return (
    <motion.p
      aria-hidden="true"
      className={cn(headingPartClassName, className)}
      data-sanity={dataSanity}
      style={{ x }}
    >
      <span
        className={headingTextClassName}
        style={
          {
            "--heading-chars": Math.max(
              stegaClean(text)?.trim().length ?? 0,
              1,
            ),
          } as React.CSSProperties
        }
      >
        {text}
      </span>
    </motion.p>
  );
}
