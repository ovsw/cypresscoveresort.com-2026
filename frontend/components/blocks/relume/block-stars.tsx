import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { stegaClean } from "next-sanity";

export const BLOCK_STARS_MAX = 5;

/** A whole number of stars from 0 to 5; Studio allows only 1 to 5. */
export function blockStarCount(rating?: number | null) {
  const value = stegaClean(rating);
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(BLOCK_STARS_MAX, Math.max(0, Math.round(value)));
}

type BlockStarsProps = {
  rating?: number | null;
  /** Classes of the row, from the Relume original's wrapper. */
  className?: string;
  /** Classes of each star, from the Relume original's star icon. */
  starClassName?: string;
  dataSanity?: string;
};

/**
 * The star rating of a block imported from Relume: that many filled lucide
 * stars, read as one image with a label ("4 out of 5 stars"), as the
 * hand-finished testimonial17 draws it. Studio requires a rating from 1 to
 * 5, so the row is missing only for content Studio would not publish.
 */
export function BlockStars({
  rating,
  className,
  starClassName,
  dataSanity,
}: BlockStarsProps) {
  const stars = blockStarCount(rating);
  if (!stars) return null;
  return (
    <div
      aria-label={`${stars} out of ${BLOCK_STARS_MAX} stars`}
      className={className}
      data-sanity={dataSanity}
      role="img"
    >
      {Array.from({ length: stars }, (_, index) => (
        <Star
          aria-hidden="true"
          className={cn("shrink-0 fill-current", starClassName)}
          key={index}
        />
      ))}
    </div>
  );
}
