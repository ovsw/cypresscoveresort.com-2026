// Hand-finished from relume/source/testimonial18.tsx (Relume Testimonial 18).
// Listed under "Hand-finished blocks" in docs/agents/relume-import.md, so the
// converter never regenerates it. Edit it by hand.
import { BlockImage } from "@/components/blocks/relume/block-image";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { Star } from "lucide-react";
import { stegaClean } from "next-sanity";
import {
  resolveBlockTheme,
  blockSceneClassName,
  type BlockSceneProps,
} from "../block-boundaries";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type RelumeTestimonial18Block = Extract<
  PageBlock,
  { _type: "relumeTestimonial18" }
>;

type RelumeTestimonial18Props = RelumeTestimonial18Block & {
  dataAttribute?: (path: string) => string | undefined;
} & BlockSceneProps;

const MAX_STARS = 5;

/** A whole number of stars from 0 to 5; Studio allows only 1 to 5. */
function starCount(rating?: number | null) {
  if (typeof rating !== "number" || !Number.isFinite(rating)) return 0;
  return Math.min(MAX_STARS, Math.max(0, Math.round(rating)));
}

// The Page Builder excludes blocks without content from visible adjacency.
// Keep this rule aligned with the renderer's empty result below.
export function hasRelumeTestimonial18Content(
  block: Pick<RelumeTestimonial18Block, "heading">,
) {
  return Boolean(stegaClean(block.heading)?.trim());
}

export default function RelumeTestimonial18({
  _key,
  bottom = "outer",
  dataAttribute,
  heading,
  description,
  testimonials,
  theme,
  top = "outer",
}: RelumeTestimonial18Props) {
  if (!hasRelumeTestimonial18Content({ heading })) return null;

  const headingId = `relume-testimonial18-${stegaClean(_key)}-heading`;

  return (
    <section
      aria-labelledby={headingId}
      className={blockSceneClassName(resolveBlockTheme(theme), top, bottom)}
      data-sanity={dataAttribute?.("theme")}
    >
      <div className="container">
        <div className="mx-auto mb-12 w-full max-w-[48rem] text-center md:mb-18 lg:mb-20">
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
        {/* Masonry: the cards run down one column, then the next, each at
            its own height. `break-inside-avoid` keeps a card whole. */}
        <div className="columns-1 gap-x-8 md:columns-2 lg:columns-3">
          {(testimonials ?? []).map((testimonial) => {
            const itemPath = `testimonials[_key=="${testimonial._key}"]`;
            const stars = starCount(stegaClean(testimonial.rating));
            return (
              <figure
                key={testimonial._key}
                className="mb-8 inline-block w-full break-inside-avoid overflow-hidden rounded-card border border-border bg-card p-6 text-card-foreground md:p-8"
              >
                {stars ? (
                  <div
                    aria-label={`${stars} out of ${MAX_STARS} stars`}
                    className="mb-5 flex gap-1 md:mb-6"
                    data-sanity={dataAttribute?.(`${itemPath}.rating`)}
                    role="img"
                  >
                    {Array.from({ length: stars }, (_, starIndex) => (
                      <Star
                        aria-hidden="true"
                        className="size-6 shrink-0 fill-current text-card-foreground"
                        key={starIndex}
                      />
                    ))}
                  </div>
                ) : null}
                <blockquote
                  className="typo-body-editorial"
                  data-sanity={dataAttribute?.(`${itemPath}.quote`)}
                >
                  {testimonial.quote}
                </blockquote>
                <figcaption className="mt-5 flex w-full flex-col items-start gap-4 md:mt-6 md:w-fit md:flex-row md:items-center">
                  <div className="size-12 min-h-12 min-w-12 overflow-hidden rounded-full">
                    <BlockImage
                      className="size-full object-cover"
                      dataSanity={dataAttribute?.(`${itemPath}.avatar`)}
                      image={testimonial.avatar}
                      sizes="48px"
                    />
                  </div>
                  <div>
                    <p
                      className="font-semibold"
                      data-sanity={dataAttribute?.(`${itemPath}.name`)}
                    >
                      {testimonial.name}
                    </p>
                    {stegaClean(testimonial.jobTitle)?.trim() ||
                    stegaClean(testimonial.companyName)?.trim() ? (
                      <p>
                        {stegaClean(testimonial.jobTitle)?.trim() ? (
                          <span
                            data-sanity={dataAttribute?.(
                              `${itemPath}.jobTitle`,
                            )}
                          >
                            {testimonial.jobTitle}
                          </span>
                        ) : null}
                        {stegaClean(testimonial.jobTitle)?.trim() &&
                        stegaClean(testimonial.companyName)?.trim()
                          ? ", "
                          : null}
                        {stegaClean(testimonial.companyName)?.trim() ? (
                          <span
                            data-sanity={dataAttribute?.(
                              `${itemPath}.companyName`,
                            )}
                          >
                            {testimonial.companyName}
                          </span>
                        ) : null}
                      </p>
                    ) : null}
                  </div>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
