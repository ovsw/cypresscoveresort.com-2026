// The Block library's names and paths, in one place for the Studio seed
// (studio/scripts/block-library.mjs writes the block pages at these slugs)
// and the Website (the /block-library index links each block to its page
// and filters by these category slugs). Plain JavaScript, so the seed runs
// it under Node and the Website imports it as it is.

export const BLOCK_LIBRARY_SLUG = "block-library";
/** The last slug segment of a block's Dark page. */
export const BLOCK_LIBRARY_DARK_SEGMENT = "dark";

// Editor-facing names for Relume's categories. A category missing here
// still gets a name from its slug ("blog-header-sections" becomes
// "Blog header").
const CATEGORY_NAMES = {
  "hero-header-sections": "Heroes",
  "header-sections": "Headers",
  "feature-sections": "Features",
  "cta-sections": "Calls to action",
  "testimonial-sections": "Testimonials",
  "stats-sections": "Stats",
  "logo-sections": "Logos",
  "faq-sections": "FAQs",
  "team-sections": "Team",
  "contact-sections": "Contact",
  "gallery-sections": "Galleries",
  "pricing-sections": "Pricing",
  "blog-sections": "Blog",
  "blog-header-sections": "Blog headers",
  "career-sections": "Careers",
  "comparison-sections": "Comparisons",
  "event-sections": "Events",
  "long-form-content-sections": "Long-form content",
  "portfolio-sections": "Portfolios",
  "product-list-sections": "Product lists",
};

/**
 * The plain name editors see for a Relume category slug.
 *
 * @param {string} category
 * @returns {string}
 */
export function categoryName(category) {
  if (Object.hasOwn(CATEGORY_NAMES, category)) return CATEGORY_NAMES[category];
  const words = category.replace(/-sections$/, "").split("-").join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * A name as one URL slug segment: "Calls to action" becomes
 * "calls-to-action".
 *
 * @param {string} name
 * @returns {string}
 */
export function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * A Relume category's segment in Block library URLs: "heroes" for
 * "hero-header-sections". The index filters by it (?category=heroes).
 *
 * @param {string} category
 * @returns {string}
 */
export function blockLibraryCategorySlug(category) {
  return toSlug(categoryName(category));
}

/**
 * The slug of a block's Light page, without a leading slash:
 * "block-library/heroes/header-1". Its Dark page adds "/dark".
 *
 * @param {string} category The Relume category, such as "hero-header-sections".
 * @param {string} title The block's name, such as "Header 1".
 * @returns {string}
 */
export function blockLibraryBlockSlug(category, title) {
  return `${BLOCK_LIBRARY_SLUG}/${blockLibraryCategorySlug(category)}/${toSlug(title)}`;
}
