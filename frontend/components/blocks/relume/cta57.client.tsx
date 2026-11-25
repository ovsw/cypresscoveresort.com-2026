"use client";

// Hand-finished from relume/source/cta57.tsx (Relume CTA 57), browser half.
// Listed under "Hand-finished blocks" in docs/agents/relume-import.md; do not
// regenerate.
import {
  BlockButtons,
  type BlockButtonRole,
} from "@/components/blocks/relume/block-buttons";
import { blockDataAttribute } from "@/components/blocks/relume/block-editing";
import { cn } from "@/lib/utils";
import { MotionConfig, motion } from "motion/react";
import { stegaClean } from "next-sanity";
import { resolveBlockTheme, blockSceneClassName } from "../block-boundaries";
import type { RelumeCta57Props } from "./cta57";

// A button's style comes from its position, as in the Relume original.
const buttonsRoles: BlockButtonRole[] = [
  { variant: "primary" },
  { variant: "outline" },
];

export default function RelumeCta57Client({
  _key,
  bottom = "outer",
  editing,
  headingLines,
  description,
  buttons,
  theme,
  top = "outer",
}: Omit<RelumeCta57Props, "_type">) {
  const dataAttribute = blockDataAttribute(editing);
  const headingId = `relume-cta57-${stegaClean(_key)}-heading`;

  return (
    <MotionConfig reducedMotion="user">
      {/* The lines start half their width off to the side, so the block
          clips them rather than widen the page. */}
      <section
        aria-labelledby={headingId}
        className={cn(
          blockSceneClassName(resolveBlockTheme(theme), top, bottom),
          "overflow-hidden",
        )}
        data-sanity={dataAttribute?.("theme")}
      >
        <div className="container">
          <div className="mx-auto w-full max-w-[48rem] text-center">
            {/* Relume puts the space under the heading on every line but
                the first; it sits under the heading here, so three lines
                keep the same spacing as two. */}
            <h2
              className="mb-5 md:mb-6"
              data-sanity={dataAttribute?.("headingLines")}
              id={headingId}
            >
              {(headingLines ?? []).map((line, index) => (
                <motion.span
                  key={index}
                  className="block typo-feature-heading motion-reduce:transform-none! motion-reduce:opacity-100!"
                  initial={{ x: index % 2 === 0 ? "-50%" : "50%", opacity: 0 }}
                  transition={{
                    type: "spring",
                    bounce: 0,
                    duration: 0.5,
                    delay: index * 0.2,
                  }}
                  viewport={{ once: true }}
                  whileInView={{ x: "0%", opacity: 1 }}
                >
                  {line}
                </motion.span>
              ))}
            </h2>
            {stegaClean(description)?.trim() ? (
              <p
                className="typo-body-editorial"
                data-sanity={dataAttribute?.("description")}
              >
                {description}
              </p>
            ) : null}
            <BlockButtons
              buttons={buttons}
              className="mt-6 flex items-center justify-center gap-x-4 md:mt-8"
              dataAttribute={dataAttribute}
              roles={buttonsRoles}
            />
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}
