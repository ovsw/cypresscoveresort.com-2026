import {
  SanityPageRoute,
  sanityPageMetadata,
} from "@/components/sanity-page-route";
import { isReservedPagePath, isRouteSlug, pagePath } from "@/lib/routes";
import { PAGES_SLUGS_QUERY } from "@/sanity/lib/fetch";
import { sanityFetchStaticParams } from "@/sanity/lib/live";
import type { PAGES_SLUGS_QUERY_RESULT } from "@/sanity.types";

export const instant = false;

type Props = { params: Promise<{ slug: string[] }> };

function readPageSlug(segments: string[]) {
  if (!segments.length || !segments.every(isRouteSlug)) return null;
  const slug = segments.join("/");
  const path = pagePath(slug);
  return path && !isReservedPagePath(path) ? slug : null;
}

export async function generateStaticParams() {
  const { data: pages } = (await sanityFetchStaticParams({
    query: PAGES_SLUGS_QUERY,
  })) as { data: PAGES_SLUGS_QUERY_RESULT };

  return pages.flatMap((page) => {
    const slug = page.slug?.current?.replace(/^\/+|\/+$/g, "");
    const segments = slug?.split("/") ?? [];
    return slug && readPageSlug(segments) ? [{ slug: segments }] : [];
  });
}

export async function generateMetadata(props: Props) {
  const { slug } = await props.params;
  return sanityPageMetadata(readPageSlug(slug));
}

export default function PageRoute(props: Props) {
  return (
    <SanityPageRoute
      slug={props.params.then(({ slug }) => readPageSlug(slug))}
    />
  );
}
