import { urlInternalHref } from "./internal-href";

// One shared `button` object, as every block renders it. There is no style
// field: the block picks each button's role from its position.
export const buttonQuery = `
  _key,
  _type,
  text,
  "openInNewTab": url.openInNewTab,
  "href": select(
    url.type == "internal" => ${urlInternalHref},
    url.type == "external" => url.external,
    url.href
  )
`;
