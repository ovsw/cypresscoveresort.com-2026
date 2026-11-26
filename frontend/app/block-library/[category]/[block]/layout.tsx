// The frame around a Block library block page. It is the site's main layout
// (app/(main)/layout.tsx) without the header and footer: the page is there to
// show one block alone, so the only thing above the block is the small
// Block library bar.
import { DisableDraftMode } from "@/components/disable-draft-mode";
import { OverlayTitleLink } from "@/components/overlay-title-link";
import { SanityLive } from "@/sanity/lib/live";
import { VisualEditing } from "next-sanity/visual-editing";
import { draftMode } from "next/headers";

export default async function BlockPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isEnabled: isDraftMode } = await draftMode();

  return (
    <>
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <SanityLive
        includeDrafts={isDraftMode}
        waitFor={process.env.VERCEL_ENV === "production" ? "function" : undefined}
      />
      {isDraftMode && (
        <>
          <DisableDraftMode />
          <OverlayTitleLink />
          <VisualEditing />
        </>
      )}
    </>
  );
}
