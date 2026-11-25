"use client";

// Hand-finished from relume/source/header103.tsx (Relume Header 103), browser
// half. Each tab's bar fills (Relume's spring, about six seconds), then the
// next tab opens and its text rises into place. The rotation pauses while
// the pointer is over the hero or keyboard focus is inside it, and stops for
// good once a visitor picks a tab (WCAG 2.2.2). With reduced motion nothing
// moves on by itself: the open tab's bar is full and the text stands still.
// Listed under "Hand-finished blocks" in docs/agents/relume-import.md; do
// not regenerate.
import {
  BlockButtons,
  type BlockButtonRole,
} from "@/components/blocks/relume/block-buttons";
import { blockDataAttribute } from "@/components/blocks/relume/block-editing";
import { BlockImage } from "@/components/blocks/relume/block-image";
import {
  BlockTabs,
  BlockTabsContent,
  BlockTabsList,
  BlockTabsTrigger,
} from "@/components/blocks/relume/block-tabs";
import { cn } from "@/lib/utils";
import {
  MotionConfig,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type AnimationPlaybackControls,
} from "motion/react";
import { stegaClean } from "next-sanity";
import { useEffect, useRef, useState } from "react";
import { resolveBlockTheme, blockSceneClassName } from "../block-boundaries";
import type { RelumeHeader103Props } from "./header103";

// A button's style comes from its position, as in the Relume original
// (`alternate` and `secondary-alt`, its buttons for a dark ground).
const buttonsRoles: BlockButtonRole[] = [
  { variant: "primary" },
  { variant: "outline" },
];

export default function RelumeHeader103Client({
  _key,
  bottom = "outer",
  editing,
  tabs,
  leadsPage = false,
  theme,
  top = "outer",
}: Omit<RelumeHeader103Props, "_type">) {
  const dataAttribute = blockDataAttribute(editing);
  const Heading1 = leadsPage ? "h1" : "h2";
  const items = tabs ?? [];
  const blockId = `relume-header103-${stegaClean(_key)}`;

  const [activeKey, setActiveKey] = useState(items[0]?._key);
  // An edit in Presentation can remove the open tab; the first one opens.
  const active = items.find((tab) => tab._key === activeKey) ?? items[0];
  const activeIndex = active ? items.indexOf(active) : 0;
  // Whether a tab other than the first has opened: the first tab's text
  // stands in place when the page loads, as Relume's `initial={false}`.
  const [moved, setMoved] = useState(false);

  const reduceMotion = useReducedMotion();
  const [chosen, setChosen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const rotating = !reduceMotion && !chosen && items.length > 1;
  const paused = hovered || focused;
  const pausedRef = useRef(paused);
  const progress = useMotionValue(0);
  const controls = useRef<AnimationPlaybackControls | null>(null);
  const nextKey = items[(activeIndex + 1) % Math.max(items.length, 1)]?._key;

  useEffect(() => {
    // `jump` also clears the velocity the last fill ended with, which
    // `set` would carry into the next spring.
    progress.jump(0);
    if (!rotating) return;
    const animation = animate(progress, 1, {
      type: "spring",
      stiffness: 25,
      damping: 30,
      onComplete: () => {
        setMoved(true);
        setActiveKey(nextKey);
      },
    });
    if (pausedRef.current) animation.pause();
    controls.current = animation;
    return () => animation.stop();
  }, [active?._key, nextKey, progress, rotating]);

  useEffect(() => {
    pausedRef.current = paused;
    if (paused) controls.current?.pause();
    else controls.current?.play();
  }, [paused]);

  if (!active) return null;

  const tabPath = (key: string, field: string) =>
    `tabs[_key=="${key}"].${field}`;

  return (
    <MotionConfig reducedMotion="user">
      <section
        aria-labelledby={`${blockId}-${stegaClean(active._key)}-heading`}
        className={cn(
          blockSceneClassName(resolveBlockTheme(theme), top, bottom),
          "relative",
        )}
        data-sanity={dataAttribute?.("theme")}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null))
            setFocused(false);
        }}
        onFocus={() => setFocused(true)}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") setHovered(true);
        }}
        onPointerLeave={() => setHovered(false)}
      >
        <BlockTabs
          value={active._key}
          onValueChange={(value) => {
            setChosen(true);
            setMoved(true);
            setActiveKey(value);
          }}
        >
          {/* The content sits over the photo and takes every click, so it
              carries the open tab's photo for click-to-edit: a click on an
              empty part of the hero opens the photo, a click on text opens
              that text. */}
          <div
            className="relative z-10 container block-scene-dark text-foreground"
            data-sanity={dataAttribute?.(tabPath(active._key, "image"))}
          >
            <div className="flex max-h-[60rem] min-h-(--screen-block-content) flex-col items-center">
              <div className="flex w-full flex-1 items-center justify-center py-16 md:py-24 lg:py-28">
                {items.map((tab) => (
                  <BlockTabsContent
                    key={tab._key}
                    value={tab._key}
                    className="w-full"
                  >
                    <motion.div
                      className="relative z-10 mx-auto max-w-[48rem] text-center motion-reduce:transform-none! motion-reduce:opacity-100!"
                      initial={moved ? { y: "20%", opacity: 0 } : false}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                      <Heading1
                        className="mb-5 typo-feature-heading text-foreground md:mb-6"
                        data-sanity={dataAttribute?.(
                          tabPath(tab._key, "heading"),
                        )}
                        id={`${blockId}-${stegaClean(tab._key)}-heading`}
                      >
                        {tab.heading}
                      </Heading1>
                      {stegaClean(tab.description)?.trim() ? (
                        <p
                          className="typo-body-editorial text-foreground"
                          data-sanity={dataAttribute?.(
                            tabPath(tab._key, "description"),
                          )}
                        >
                          {tab.description}
                        </p>
                      ) : null}
                      <BlockButtons
                        buttons={tab.buttons}
                        className="mt-6 flex items-center justify-center gap-x-4 md:mt-8"
                        dataAttribute={dataAttribute}
                        path={tabPath(tab._key, "buttons")}
                        roles={buttonsRoles}
                      />
                    </motion.div>
                  </BlockTabsContent>
                ))}
              </div>
              <BlockTabsList className="flex w-full justify-center gap-4 lg:max-w-[64rem]">
                {items.map((tab) => {
                  const isActive = tab._key === active._key;
                  return (
                    <BlockTabsTrigger
                      key={tab._key}
                      value={tab._key}
                      className="relative flex flex-1 items-center justify-center px-4 py-4 text-center whitespace-normal text-foreground sm:px-8 md:min-w-32"
                      data-sanity={dataAttribute?.(tabPath(tab._key, "label"))}
                    >
                      <span>{tab.label}</span>
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-0 h-1 bg-foreground/20"
                      >
                        <motion.span
                          className={cn(
                            "block h-full origin-left bg-foreground",
                            // The open tab's bar follows the rotation frame
                            // by frame; every other change eases, as Relume's.
                            !(isActive && rotating) &&
                              "transition-transform duration-300 ease-in-out motion-reduce:transition-none",
                          )}
                          style={{
                            scaleX: isActive ? (rotating ? progress : 1) : 0,
                          }}
                        />
                      </span>
                    </BlockTabsTrigger>
                  );
                })}
              </BlockTabsList>
            </div>
          </div>
        </BlockTabs>
        {/* Every tab's photo is drawn, the open one on top, so the next one is
            loaded before it shows. The scrim lets a click through to the
            open photo for click-to-edit. */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {items.map((tab) => (
            <BlockImage
              className={cn(
                "absolute inset-0 size-full object-cover",
                tab._key === active._key
                  ? "pointer-events-auto opacity-100"
                  : "opacity-0",
              )}
              dataSanity={dataAttribute?.(tabPath(tab._key, "image"))}
              image={tab.image}
              key={tab._key}
              sizes="100vw"
            />
          ))}
          <div className="absolute inset-0 bg-scrim/60" />
        </div>
      </section>
    </MotionConfig>
  );
}
