import type { UrlRule } from "sanity";
import { videoEmbedUrl } from "../../../shared/video-link.ts";

/** What the video field of a block converted from Relume tells an editor. */
export const videoLinkHelp =
  "Paste a link to a YouTube or Vimeo video. It plays in a pop-up when a visitor clicks the play button.";

/**
 * A required link to a video the Website can play in its pop-up: a YouTube
 * or Vimeo link, in any form `videoEmbedUrl` reads.
 */
export function videoLink(rule: UrlRule, message: string) {
  return [
    rule.required().error(message),
    rule.custom((value) =>
      !value || videoEmbedUrl(value)
        ? true
        : "Use a link to a YouTube or Vimeo video, such as https://www.youtube.com/watch?v=8DKLYsikxTs.",
    ),
  ];
}
