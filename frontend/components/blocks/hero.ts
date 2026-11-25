/**
 * A hero is a block of a category that `heroCategories` in
 * scripts/relume/convert.mjs lets open a page: Relume's hero, blog post,
 * event, portfolio and product headers. Each category's slugs share a prefix
 * no other category uses, so the type name tells them apart;
 * scripts/relume-import.test.mjs checks that against relume/catalogue.json.
 */
export function isHeroBlockType(type: string) {
  return /^relume(Header|Blogpostheader|Eventitemheader|Portfolioheader|Productheader)\d+$/.test(
    type,
  );
}
