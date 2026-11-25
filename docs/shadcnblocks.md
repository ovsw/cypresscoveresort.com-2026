# Website block sources

These parts of the Website adapt Shadcnblocks layouts to Sanity content and Next.js links and images. They retain safe link checks, accessible controls, and Sanity field editing. They are adaptations, not unmodified registry files.

The Page Builder block library is not listed here. See "Block library" in `docs/content-model.md`.

| Website part                   | Shadcnblocks source                                       |
| ------------------------------ | --------------------------------------------------------- |
| Article cards                  | [blog1](https://www.shadcnblocks.com/block/blog1)         |
| Page headings and article body | [blogpost1](https://www.shadcnblocks.com/block/blogpost1) |
| Article actions                | [cta3](https://www.shadcnblocks.com/block/cta3)           |
| Website navigation             | [navbar1](https://www.shadcnblocks.com/block/navbar1)     |

The Website footer adapts Relume's Footer 5 (`footer5` in the Relume Library): newsletter signup, logo and link columns, then copyright, legal links and social icons. It always uses the Dark block theme. The signup posts to `NEWSLETTER_SIGNUP_WEBHOOK_URL`; without it, the footer shows the editor's error message.

Shared controls use shadcn/ui. The seed bundles neutral PNG images and uploads them to the destination dataset. It contains no source project IDs or credentials. Seed only an empty dataset. No data migration runs on existing sites.
