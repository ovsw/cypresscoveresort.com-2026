import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";
import type { SanityImageSource } from "@sanity/image-url";
import { stegaClean } from "next-sanity";
import Image from "next/image";

/** An image field as the block queries project it. */
export type BlockImageValue = {
  alt?: string | null;
  asset?: {
    _id?: string | null;
    metadata?: {
      dimensions?: { height?: number | null; width?: number | null } | null;
      lqip?: string | null;
    } | null;
  } | null;
  crop?: {
    bottom?: number | null;
    left?: number | null;
    right?: number | null;
    top?: number | null;
  } | null;
} | null;

type BlockImageProps = {
  className?: string;
  dataSanity?: string;
  image?: BlockImageValue;
  /** The `sizes` hint. Default: the image never spans more than the page. */
  sizes?: string;
};

/**
 * The classes of a logo image: on a Dark theme the logo is drawn in white,
 * since logo artwork is usually dark on a transparent ground and would vanish
 * there. The hand-finished logo3 and every block the converter writes from a
 * Relume logo section (`logoCategories` in scripts/relume/convert.mjs) use it.
 */
export const blockLogoClassName =
  "in-[.block-scene-dark]:brightness-0 in-[.block-scene-dark]:invert";

/** True when the image field holds an uploaded asset the Website can draw. */
export function hasBlockImage(image?: BlockImageValue) {
  return Boolean(image?.asset?._id);
}

/**
 * An image of a block imported from Relume, at its own proportions, as the
 * `<img>` in the Relume original. Draws nothing without an uploaded asset.
 */
export function BlockImage({
  className,
  dataSanity,
  image,
  sizes = "(min-width: 768px) 50vw, 100vw",
}: BlockImageProps) {
  if (!image || !hasBlockImage(image)) return null;
  const metadata = image.asset?.metadata;
  // The image URL applies the editor's crop, so the reserved space must have
  // the cropped proportions, not the asset's.
  const kept = (near?: number | null, far?: number | null) =>
    Math.max(1 - (near ?? 0) - (far ?? 0), 0.01);
  const width = Math.round(
    (metadata?.dimensions?.width ?? 1600) *
      kept(image.crop?.left, image.crop?.right),
  );
  const height = Math.round(
    (metadata?.dimensions?.height ?? 900) *
      kept(image.crop?.top, image.crop?.bottom),
  );

  return (
    <Image
      alt={stegaClean(image.alt)?.trim() || ""}
      blurDataURL={metadata?.lqip || undefined}
      // The Relume original is a plain <img> that takes its size from its
      // classes. Without these two, the width and height attributes below
      // would stretch an image that only limits its height, such as a logo.
      className={cn("h-auto w-auto", className)}
      data-sanity={dataSanity}
      height={height}
      placeholder={metadata?.lqip ? "blur" : undefined}
      sizes={sizes}
      src={urlFor(image as SanityImageSource)
        .width(1600)
        .fit("max")
        .url()}
      width={width}
    />
  );
}
