"use client";

// The video pop-up of a block imported from Relume: the block draws a play
// button (a poster image under a play icon), and a click plays the video in
// a dialog over the page. Relume builds it from its own Dialog and an
// <iframe>; the converter writes this in its place (see "Video pop-ups" in
// docs/agents/relume-import.md).
import * as Dialog from "@radix-ui/react-dialog";
import { LoaderCircle, X } from "lucide-react";
import { stegaClean } from "next-sanity";
import { useState, type ReactNode } from "react";
import { videoEmbedUrl } from "../../../../shared/video-link";

type BlockVideoDialogProps = {
  /** The play button: one <button> element, which opens the pop-up. */
  children: ReactNode;
  /** The editor's link to a YouTube or Vimeo video. */
  video?: string | null;
};

/**
 * Wraps a block's play button so that it opens the video in a pop-up. The
 * player is loaded only once the pop-up opens, so the page makes no request
 * to the video site before a visitor asks for the video. Without a link the
 * Website can play, the button is drawn and does nothing.
 */
export function BlockVideoDialog({ children, video }: BlockVideoDialogProps) {
  const [loaded, setLoaded] = useState(false);
  const player = videoEmbedUrl(stegaClean(video));
  if (!player) return children;

  return (
    <Dialog.Root onOpenChange={() => setLoaded(false)}>
      <Dialog.Trigger asChild aria-label="Play video">
        {children}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-scrim/80 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          aria-describedby={undefined}
          className="block-scene-dark fixed inset-0 z-[80] flex items-center justify-center p-4 text-foreground md:p-8"
        >
          <Dialog.Title className="sr-only">Video</Dialog.Title>
          {/* As wide as the screen allows, and no taller than it: on a short
              screen (a phone on its side) the height sets the width. */}
          <div className="relative aspect-video w-full max-w-[min(60rem,calc((100dvh-4rem)*16/9))]">
            {loaded ? null : (
              <LoaderCircle
                aria-hidden="true"
                className="absolute inset-0 m-auto size-16 animate-spin motion-reduce:animate-none"
              />
            )}
            <iframe
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="relative size-full"
              onLoad={() => setLoaded(true)}
              src={player}
              title="Video player"
            />
          </div>
          <Dialog.Close className="absolute top-3 right-3 flex min-h-11 min-w-11 items-center justify-center rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <X aria-hidden="true" className="size-6" />
            <span className="sr-only">Close</span>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
