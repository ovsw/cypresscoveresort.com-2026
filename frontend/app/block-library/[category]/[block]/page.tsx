// A Block library block page on Light: the block's Sanity page, drawn
// without the site's header and footer (see layout.tsx beside this file).
import {
  SanityPageRoute,
  sanityPageMetadata,
} from "@/components/sanity-page-route";
import { blockPageSlug, type BlockPageParams } from "@/lib/block-library-route";

export const instant = false;

type Props = { params: Promise<BlockPageParams> };

export async function generateMetadata(props: Props) {
  return sanityPageMetadata(blockPageSlug(await props.params, "light"));
}

export default function BlockPage(props: Props) {
  return (
    <SanityPageRoute
      slug={props.params.then((params) => blockPageSlug(params, "light"))}
    />
  );
}
