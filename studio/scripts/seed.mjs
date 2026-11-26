#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import process from "node:process";
import { createClient } from "@sanity/client";
import {
  BLOCK_LIBRARY_ID_PREFIX,
  blockLibraryPages,
} from "./block-library.mjs";
import { uploadImageAsset } from "./lib/image-assets.mjs";

const directory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(directory, "..", "..");

function parseEnvValue(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const name = trimmed.slice(0, separator).trim();
    if (process.env[name] !== undefined) continue;
    process.env[name] = parseEnvValue(trimmed.slice(separator + 1));
  }
}

loadEnvFile(path.join(rootDirectory, "studio", ".env.local"));

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID;
const DATASET = process.env.SANITY_STUDIO_DATASET;
const API_VERSION = process.env.SANITY_STUDIO_API_VERSION || "2026-03-23";
const TOKEN = process.env.SANITY_AUTH_TOKEN;

export const STARTER_SEED = {
  name: "next-sanity-starter",
  version: 1,
};

// Relume's placeholder images, as PNGs. "landscape" is the default; the
// numbered ones mark the order of images that move (a slider, a marquee, a
// parallax), so the motion reads at a glance.
// Asset IDs derive from the bundled bytes, not from any project's dataset.
export const STARTER_ASSETS = [
  "landscape",
  "numbered-1",
  "numbered-2",
  "numbered-3",
  "numbered-4",
  "avatar",
  "logo",
].map((name) => {
  const buffer = readFileSync(
    path.join(directory, "seed-assets", `${name}.png`),
  );
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return {
    name,
    buffer,
    id: `image-${createHash("sha1").update(buffer).digest("hex")}-${width}x${height}-png`,
  };
});
/**
 * A placeholder as it is uploaded: the ID it gets, and the filename the seed
 * gives it. `pnpm seed` and `pnpm page:seed` both upload through this.
 */
export function starterAssetUpload(source) {
  return {
    id: source.id,
    filename: `starter-${source.name}.png`,
    contentType: "image/png",
    buffer: source.buffer,
  };
}
export const STARTER_IMAGE_ASSET_ID = STARTER_ASSETS[0].id;
// The placeholders an earlier seed uploaded (landscape, square, avatar).
// `unseed` removes them too, so a dataset seeded before the switch to Relume's
// placeholders empties fully and can be seeded again. `seed` never uploads
// them.
export const LEGACY_STARTER_ASSET_IDS = [
  "image-7024d190e286aa9315cdd9ca3f703b12bdcda915-2667x2000-png",
  "image-f22be1a853ae734ce1b9381ef017d1e150347496-2666x2666-png",
  "image-87fcecbcf3ba2042d7c1c86245b9d3d19e0fb532-512x512-png",
];
const placeholder = (name) => ({
  _type: "image",
  alt: "Neutral placeholder image.",
  asset: {
    _type: "reference",
    _ref: STARTER_ASSETS.find((asset) => asset.name === name).id,
  },
});
const imageRef = placeholder("landscape");

const ref = (_ref) => ({ _type: "reference", _ref });
const slug = (current) => ({ _type: "slug", current });
const block = (key, text, style = "normal") => ({
  _key: key,
  _type: "block",
  children: [{ _key: `${key}-span`, _type: "span", marks: [], text }],
  markDefs: [],
  style,
});
const simpleText = (key, text) => [block(key, text)];
const internalUrl = (_ref) => ({
  _type: "customUrl",
  type: "internal",
  internal: ref(_ref),
  openInNewTab: false,
});
const button = (key, text, _ref) => ({
  _key: key,
  _type: "button",
  text,
  url: internalUrl(_ref),
});
const meta = (title, description) => ({
  title,
  description,
  noindex: false,
  image: imageRef,
});

// The Block library page's id before "section" became "block".
export const LEGACY_BLOCK_LIBRARY_PAGE_ID = "starter-page-section-library";

// The Block library: a Light and a Dark page for every block imported from
// Relume, to look at and to copy from. The index that lists them is a
// Website route, not a seeded page.
const blockLibrary = blockLibraryPages({
  button: (key, text) => button(key, text, "homePage"),
  image: placeholder,
});
export const BLOCK_LIBRARY_BLOCK_PAGE_IDS = blockLibrary.blockPages.map(
  (page) => page._id,
);

// Pages an earlier seed wrote that this one no longer does: the "Section
// library" page, and the Block library's index and category pages. `unseed`
// deletes them where they are still present, so such a dataset empties fully.
export const RETIRED_STARTER_PAGE_IDS = [
  LEGACY_BLOCK_LIBRARY_PAGE_ID,
  ...blockLibrary.retiredPageIds,
];

export const STARTER_DOCUMENT_TYPES = new Map([
  ["settings", "settings"],
  ["navigation", "navigation"],
  ["footer", "footer"],
  ["homePage", "homePage"],
  ["blogIndex", "blogIndex"],
  ["blogPostSettings", "blogPostSettings"],
  ["starter-page-about", "page"],
  ...BLOCK_LIBRARY_BLOCK_PAGE_IDS.map((id) => [id, "page"]),
  ["starter-category-notes", "category"],
  ["starter-post-field-guide", "post"],
  ["starter-faq-getting-started", "faq"],
  ["starter-testimonial-reader", "testimonial"],
]);

// Sample documents of types this project removed. An older seed may have
// left them in the dataset, so unseed deletes the ones it finds, after
// checking they carry the seed's marker.
const RETIRED_STARTER_DOCUMENT_TYPES = new Map([
  ["starter-author-editor", "author"],
  ["starter-team-member-editor", "teamMember"],
]);
export const RETIRED_STARTER_DOCUMENT_IDS = [
  ...RETIRED_STARTER_DOCUMENT_TYPES.keys(),
];

const marker = {
  _starterSeed: STARTER_SEED,
};

export const starterDocuments = [
  {
    _id: "settings",
    _type: "settings",
    ...marker,
    siteName: "Starter Example",
    contact: {
      _type: "contactDetails",
      email: "hello@example.com",
      phone: "+1 555 0100",
      addressLines: ["123 Example Street", "Sample City"],
    },
    socialLinks: [
      {
        _key: "starter-social",
        _type: "socialLink",
        label: "LinkedIn",
        url: "https://example.com",
      },
    ],
  },
  {
    _id: "starter-category-notes",
    _type: "category",
    ...marker,
    title: "Field Notes",
    slug: slug("field-notes"),
    description:
      "Short articles that test category archives and article metadata.",
    meta: meta(
      "Field Notes | Starter Example",
      "Example category metadata for the Starter seed.",
    ),
  },
  {
    _id: "starter-faq-getting-started",
    _type: "faq",
    ...marker,
    title: "What should this sample content prove?",
    body: simpleText(
      "starter-faq-body",
      "It proves that reusable FAQ entries can be selected and rendered.",
    ),
  },
  {
    _id: "starter-testimonial-reader",
    _type: "testimonial",
    ...marker,
    name: "Example Reader",
    title: "Seed content reviewer",
    image: placeholder("avatar"),
    body: simpleText(
      "starter-testimonial-body",
      "The sample content made every editing surface easy to find.",
    ),
    rating: 5,
  },
  {
    _id: "starter-page-about",
    _type: "page",
    ...marker,
    title: "About",
    description: "A neutral page used to test routed page rendering.",
    slug: slug("about"),
    blocks: [
      {
        _key: "starter-page-rich-text",
        _type: "richTextBlock",
        theme: "light",
        eyebrow: "Page",
        title: "A normal routed page",
        richText: [
          block(
            "starter-page-copy",
            "This page proves normal page routing and rich text rendering.",
          ),
          {
            _key: "starter-page-table",
            _type: "table",
            title: "Simple comparison",
            rows: [
              {
                _key: "starter-table-row-1",
                _type: "tableRow",
                cells: ["Field", "Purpose"],
              },
              {
                _key: "starter-table-row-2",
                _type: "tableRow",
                cells: ["Slug", "/about/"],
              },
            ],
          },
          {
            _key: "starter-page-callout",
            _type: "callout",
            title: "Callout",
            body: "This tests the callout object.",
          },
        ],
      },
    ],
    // A replaced Scaffold lives here. The Website never renders this array.
    blocksArchive: [
      {
        _key: "starter-page-archived-scaffold",
        _type: "scaffold",
        name: "About page intro",
        proposedBlockShape: "Short intro with an eyebrow and one paragraph.",
        richText: simpleText(
          "starter-page-archived-copy",
          "This Scaffold was replaced by the rich text block above. It must not appear on the page.",
        ),
      },
    ],
    meta: meta(
      "About | Starter Example",
      "Example metadata for a normal seeded page.",
    ),
  },
  {
    _id: "starter-post-field-guide",
    _type: "post",
    ...marker,
    title: "Starter Field Guide",
    slug: slug("starter-field-guide"),
    excerpt: simpleText(
      "starter-post-excerpt",
      "A short neutral post that tests article lists, sidebars, and structured data.",
    ),
    publishedAt: "2026-01-15T12:00:00.000Z",
    image: { ...imageRef, caption: "Neutral placeholder image." },
    category: ref("starter-category-notes"),
    body: [
      block(
        "starter-post-intro",
        "This article proves blog post rendering, category links, and the sidebar.",
      ),
      block("starter-post-heading", "What it covers", "h2"),
      block(
        "starter-post-body",
        "It is intentionally short so it can be deleted once real project content exists.",
      ),
    ],
    meta: meta(
      "Starter Field Guide | Starter Example",
      "Example metadata for a seeded blog post.",
    ),
  },
  {
    _id: "blogPostSettings",
    _type: "blogPostSettings",
    ...marker,
    title: "Need a next step?",
    description:
      "Use this shared panel to point readers toward a relevant action.",
    actions: [
      {
        _key: "starter-sidebar-action",
        _type: "blogPostSidebarAction",
        title: "Explore the sample page",
        description: "Confirms internal links from the blog sidebar.",
        button: {
          _type: "button",
          text: "Open About",
          url: internalUrl("starter-page-about"),
        },
      },
    ],
  },
  ...blockLibrary.blockPages.map(
    ({ slug: current, ...page }) => ({
      ...page,
      _type: "page",
      ...marker,
      slug: slug(current),
      meta: meta(
        `${page.title} | Starter Example`,
        "Example metadata for a seeded Block library page.",
      ),
    }),
  ),
  {
    _id: "blogIndex",
    _type: "blogIndex",
    ...marker,
    title: "Blog",
    description: "Example articles for testing the Starter blog.",
    blocks: [],
    meta: meta(
      "Blog | Starter Example",
      "Example metadata for the seeded Blog index.",
    ),
  },
  {
    _id: "homePage",
    _type: "homePage",
    ...marker,
    title: "Starter Example",
    description: "Neutral content that proves the retained Starter model.",
    blocks: [
      {
        _key: "starter-home-intro",
        _type: "richTextBlock",
        theme: "light",
        eyebrow: "Starter seed",
        title: "Neutral sample content for a clean project.",
        richText: simpleText(
          "starter-home-intro-copy",
          "Use this optional seed to inspect the editing model, then remove it before adding real content.",
        ),
      },
      {
        _key: "starter-home-seam",
        _type: "richTextBlock",
        theme: "light",
        title: "Matching themes join at a seam.",
        richText: simpleText(
          "starter-home-seam-copy",
          "This block shares the Light theme above it, so each side contributes half its padding.",
        ),
      },
      {
        _key: "starter-home-edge",
        _type: "richTextBlock",
        theme: "dark",
        title: "A different theme forms an edge.",
        richText: simpleText(
          "starter-home-edge-copy",
          "This Dark block keeps full padding on both sides of the join.",
        ),
      },
      {
        _key: "starter-home-scaffold",
        _type: "scaffold",
        name: "Reader quotes",
        proposedBlockShape:
          "Two or three short quotes with the reader's name and role.",
        richText: simpleText(
          "starter-home-scaffold-copy",
          "The sample content made every editing surface easy to find. Example Reader, seed content reviewer.",
        ),
      },
    ],
    meta: meta(
      "Starter Example | Starter Example",
      "Neutral Starter seed content for testing page rendering and metadata.",
    ),
  },
  {
    _id: "navigation",
    _type: "navigation",
    ...marker,
    items: [
      {
        _key: "starter-nav-home",
        _type: "navigationLink",
        label: "Home",
        destination: {
          _type: "navigationDestination",
          kind: "internal",
          internal: ref("homePage"),
          openInNewTab: false,
        },
      },
      {
        _key: "starter-nav-about",
        _type: "navigationLink",
        label: "About",
        destination: {
          _type: "navigationDestination",
          kind: "internal",
          internal: ref("starter-page-about"),
          openInNewTab: false,
        },
      },
      {
        _key: "starter-nav-resources",
        _type: "navigationGroup",
        label: "Resources",
        links: [
          {
            _key: "starter-nav-blog",
            _type: "navigationChildLink",
            label: "Blog",
            description: "Article index",
            destination: {
              _type: "navigationDestination",
              kind: "internal",
              internal: ref("blogIndex"),
              openInNewTab: false,
            },
          },
          {
            _key: "starter-nav-category",
            _type: "navigationChildLink",
            label: "Field Notes",
            description: "Category archive",
            destination: {
              _type: "navigationDestination",
              kind: "internal",
              internal: ref("starter-category-notes"),
              openInNewTab: false,
            },
          },
        ],
      },
    ],
    actions: [
      {
        _key: "starter-nav-action",
        _type: "navigationAction",
        label: "Read guide",
        destination: {
          _type: "navigationDestination",
          kind: "internal",
          internal: ref("starter-post-field-guide"),
          openInNewTab: false,
        },
      },
    ],
  },
  {
    _id: "footer",
    _type: "footer",
    ...marker,
    newsletter: {
      heading: "Join the newsletter",
      text: "Neutral newsletter copy for the optional Starter seed.",
      inputPlaceholder: "Your email address",
      buttonLabel: "Subscribe",
      successMessage: "Thanks for subscribing.",
      errorMessage: "That did not send. Please try again.",
    },
    columns: [
      {
        _key: "starter-footer-main",
        _type: "footerColumn",
        heading: "Content",
        links: [
          {
            _key: "starter-footer-home",
            _type: "footerLink",
            label: "Home",
            destination: {
              _type: "footerDestination",
              kind: "internal",
              internal: ref("homePage"),
              openInNewTab: false,
            },
          },
          {
            _key: "starter-footer-blog",
            _type: "footerLink",
            label: "Blog",
            destination: {
              _type: "footerDestination",
              kind: "internal",
              internal: ref("blogIndex"),
              openInNewTab: false,
            },
          },
        ],
      },
    ],
    legalLinks: [],
    copyrightStartYear: 2026,
    copyrightOwner: "Starter Example",
  },
];

function requireEnv(name, value) {
  if (!value?.trim()) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export function createSanitySeedClient() {
  return createClient({
    projectId: requireEnv("SANITY_STUDIO_PROJECT_ID", PROJECT_ID),
    dataset: requireEnv("SANITY_STUDIO_DATASET", DATASET),
    apiVersion: API_VERSION,
    token: requireEnv("SANITY_AUTH_TOKEN", TOKEN),
    useCdn: false,
  });
}

async function assertDatasetIsEmpty(client) {
  // Raw, so drafts count too: the client's default perspective hides them.
  const count = await client.fetch(
    'count(*[!(_id in path("_.**"))])',
    {},
    { perspective: "raw" },
  );
  if (count !== 0) {
    throw new Error(
      `Seed refused: destination dataset is not empty (${count} documents found).`,
    );
  }
}

const DRAFT_PREFIX = "drafts.";
const isDraftId = (id) => id.startsWith(DRAFT_PREFIX);

// The published id of a Starter document or its draft.
function publishedId(id) {
  return isDraftId(id) ? id.slice(DRAFT_PREFIX.length) : id;
}

// A Block library page: a block page the current shelf makes, a retired
// category page, or a page an earlier seed made for a block or category the
// shelf no longer has.
function isBlockLibraryPage(id) {
  return id.startsWith(BLOCK_LIBRARY_ID_PREFIX);
}

function expectedStarterType(id) {
  const published = publishedId(id);
  return (
    STARTER_DOCUMENT_TYPES.get(published) ??
    RETIRED_STARTER_DOCUMENT_TYPES.get(published) ??
    (RETIRED_STARTER_PAGE_IDS.includes(published) || isBlockLibraryPage(published)
      ? "page"
      : undefined)
  );
}

function assertOwnedDocument(document) {
  const expectedType = expectedStarterType(document?._id);
  if (!expectedType || document._type !== expectedType) return false;
  return (
    document._starterSeed?.name === STARTER_SEED.name &&
    document._starterSeed?.version === STARTER_SEED.version
  );
}

// Every Starter document and its draft (`pnpm page:seed` writes drafts),
// including retired pages and Block library pages the shelf no longer makes.
async function getStarterDocuments(client) {
  const ids = [
    ...STARTER_DOCUMENT_TYPES.keys(),
    ...RETIRED_STARTER_PAGE_IDS,
    ...RETIRED_STARTER_DOCUMENT_IDS,
  ];
  return client.fetch(
    "*[_id in $ids || string::startsWith(_id, $libraryPrefix) || string::startsWith(_id, $draftLibraryPrefix)]{_id,_type,_starterSeed}",
    {
      ids: [...ids, ...ids.map((id) => `${DRAFT_PREFIX}${id}`)],
      libraryPrefix: BLOCK_LIBRARY_ID_PREFIX,
      draftLibraryPrefix: `${DRAFT_PREFIX}${BLOCK_LIBRARY_ID_PREFIX}`,
    },
    { perspective: "raw" },
  );
}

async function assertOwnedSeedSet(client) {
  const documents = await getStarterDocuments(client);
  // Only published documents count as present; a draft alone does not.
  const foundIds = new Set(
    documents
      .filter((document) => !isDraftId(document._id))
      .map((document) => document._id),
  );
  // Block pages are optional: a dataset seeded before a block joined the
  // shelf lacks its pages.
  const missing = [...STARTER_DOCUMENT_TYPES.keys()].filter(
    (id) => !foundIds.has(id) && !isBlockLibraryPage(id),
  );
  if (missing.length) {
    throw new Error(
      `Unseed refused: missing Starter seed documents: ${missing.join(", ")}.`,
    );
  }
  const unsafe = documents.filter((document) => !assertOwnedDocument(document));
  if (unsafe.length) {
    throw new Error(
      `Unseed refused: these IDs are not marked as Starter seed content: ${unsafe.map((document) => document._id).join(", ")}.`,
    );
  }
  return documents;
}

export async function seed(client) {
  await assertDatasetIsEmpty(client);
  let serialized = JSON.stringify(starterDocuments);
  const assetIds = [];
  for (const source of STARTER_ASSETS) {
    const asset = await uploadImageAsset(client, starterAssetUpload(source));
    assetIds.push(asset._id);
    serialized = serialized.replaceAll(source.id, asset._id);
  }
  const documents = JSON.parse(serialized);
  let transaction = client.transaction();
  for (const document of documents) {
    transaction = transaction.createIfNotExists(document);
  }
  await transaction.commit();
  return { documents: documents.length, assetIds };
}

export async function unseed(client) {
  const found = await assertOwnedSeedSet(client);
  // Never delete replacement images uploaded by an editor. Deleting an ID
  // that is not in the dataset does nothing, so the legacy IDs are safe to
  // list for datasets seeded after the switch.
  const assetIds = [
    ...STARTER_ASSETS.map((asset) => asset.id),
    ...LEGACY_STARTER_ASSET_IDS,
  ];
  // Pages an earlier seed made that this one does not (retired pages, and
  // pages for blocks the shelf no longer has), and drafts `pnpm page:seed`
  // wrote. All passed the ownership check above.
  const foundIds = found.map((document) => document._id);
  const stalePageIds = foundIds.filter(
    (id) => !isDraftId(id) && !STARTER_DOCUMENT_TYPES.has(id),
  );
  const draftIds = foundIds.filter(isDraftId);
  // Retired ids are listed whether found or not: deleting an id that is not
  // in the dataset does nothing.
  const documentIds = [
    ...new Set([
      ...STARTER_DOCUMENT_TYPES.keys(),
      ...RETIRED_STARTER_PAGE_IDS,
      ...stalePageIds,
      ...draftIds,
    ]),
  ];
  let transaction = client.transaction();
  for (const id of [...documentIds, ...assetIds]) {
    transaction = transaction.delete(id);
  }
  await transaction.commit();
  return {
    documents: STARTER_DOCUMENT_TYPES.size + stalePageIds.length,
    assets: assetIds.length,
  };
}

async function main() {
  const command = process.argv[2] ?? "seed";
  const client = createSanitySeedClient();
  if (command === "seed") {
    const result = await seed(client);
    console.log(`Seeded ${result.documents} Starter documents.`);
    return;
  }
  if (command === "unseed") {
    const result = await unseed(client);
    console.log(
      `Removed ${result.documents} Starter documents and ${result.assets} asset(s).`,
    );
    return;
  }
  throw new Error(`Unknown command: ${command}`);
}

if (
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
