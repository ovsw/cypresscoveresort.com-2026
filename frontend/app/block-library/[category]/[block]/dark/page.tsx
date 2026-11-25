// A Block library block page on Dark; see ../page.tsx.
import {
  SanityPageRoute,
  sanityPageMetadata,
} from "@/components/sanity-page-route";
import { blockPageSlug, type BlockPageParams } from "@/lib/block-library-route";

export const instant = false;

type Props = { params: Promise<BlockPageParams> };

export async function generateMetadata(props: Props) {
  return sanityPageMetadata(blockPageSlug(await props.params, "dark"));
}

export default function DarkBlockPage(props: Props) {
  return (
    <SanityPageRoute
      slug={props.params.then((params) => blockPageSlug(params, "dark"))}
    />
  );
}
