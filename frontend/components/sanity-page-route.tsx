// A Sanity page drawn by its slug, for the routes that serve pages: the
// catch-all (app/(main)/[...slug]) and the Block library's block pages
// (app/block-library/[category]/[block]), which show the same page without
// the site's header and footer.
import { RootContentView } from "@/components/root-content";
import { pagePath } from "@/lib/routes";
import { fetchSanityPageBySlug } from "@/sanity/lib/fetch";
import {
  getDynamicFetchOptions,
  sanityFetchMetadata,
  type DynamicFetchOptions,
} from "@/sanity/lib/live";
import { generatePageMetadata } from "@/sanity/lib/metadata";
import { PAGE_QUERY } from "@/sanity/queries/page";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";

/** The page's metadata; `slug` is null when the route's params name no page. */
export async function sanityPageMetadata(slug: string | null) {
  if (!slug) return {};

  const { data: page } = (await sanityFetchMetadata({
    query: PAGE_QUERY,
    params: { slug },
    perspective: "published",
  })) as { data: PAGE_QUERY_RESULT };
  // The page renderer owns 404s. Metadata only sees published content, so a
  // 404 here would prevent draft-only routes from reaching Presentation.
  if (!page) return {};
  const path = pagePath(slug);
  if (!path) return {};

  return generatePageMetadata({ page, path });
}

/** The page at `slug`, or a 404 when the slug is null or names no page. */
export async function SanityPageRoute({
  slug,
}: {
  slug: Promise<string | null>;
}) {
  const { isEnabled: isDraftMode } = await draftMode();
  if (isDraftMode) return <DynamicPage slug={slug} />;

  const value = await slug;
  if (!value) notFound();
  return <CachedPage slug={value} perspective="published" stega={false} />;
}

async function DynamicPage({ slug }: { slug: Promise<string | null> }) {
  const [value, options] = await Promise.all([slug, getDynamicFetchOptions()]);
  if (!value) notFound();
  return <CachedPage slug={value} {...options} />;
}

async function CachedPage({
  slug,
  perspective,
  stega,
}: { slug: string } & DynamicFetchOptions) {
  const page = await fetchSanityPageBySlug({ slug, perspective, stega });
  if (!page) notFound();

  return (
    <RootContentView content={page} perspective={perspective} stega={stega} />
  );
}
