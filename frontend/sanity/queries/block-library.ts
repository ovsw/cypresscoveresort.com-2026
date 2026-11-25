import { groq } from "next-sanity";

// The slugs of the pages below /block-library: the block pages the Studio
// seed writes (block-library/heroes/header-1 and its /dark page). The
// /block-library index links a block's card only when its page is here.
export const BLOCK_LIBRARY_PAGE_SLUGS_QUERY = groq`
  *[_type == "page" && string::startsWith(slug.current, "block-library/")].slug.current
`;
