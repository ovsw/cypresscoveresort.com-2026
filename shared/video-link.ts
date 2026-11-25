// A video an editor links to: the link they paste from YouTube or Vimeo, and
// the address its player is embedded from. Studio validates with it and the
// Website's video pop-up (block-video-dialog.tsx) plays from it.

const videoId = /^[A-Za-z0-9_-]{6,20}$/;
const vimeoId = /^\d{6,12}$/;
const vimeoHash = /^[0-9a-f]{6,20}$/;

/**
 * The address of the player for a YouTube or Vimeo link, set to start
 * playing at once, or null when the link is to neither. Takes the links
 * people copy: a watch page (`youtube.com/watch?v=…`), a short link
 * (`youtu.be/…`), a Short, an embed address, or a Vimeo page
 * (`vimeo.com/123456789`, with its privacy hash when it is unlisted).
 * YouTube plays from its no-cookie domain.
 */
export function videoEmbedUrl(link: string | null | undefined): string | null {
  if (typeof link !== "string") return null;
  let url: URL;
  try {
    url = new URL(link.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.replace(/^(www|m)\./, "");
  const segments = url.pathname.split("/").filter(Boolean);

  const isYouTube =
    host === "youtu.be" ||
    host === "youtube.com" ||
    host.endsWith(".youtube.com") ||
    host === "youtube-nocookie.com";
  if (isYouTube) {
    const id =
      host === "youtu.be"
        ? segments[0]
        : segments[0] === "watch"
          ? url.searchParams.get("v")
          : ["embed", "shorts", "live"].includes(segments[0])
            ? segments[1]
            : undefined;
    return id && videoId.test(id)
      ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`
      : null;
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = host === "vimeo.com" ? segments[0] : segments[1];
    if (!id || !vimeoId.test(id)) return null;
    // An unlisted video plays only with its privacy hash: the `h` of a
    // player address, or the part after the id of a page
    // (`vimeo.com/123456789/5e2d1c1e6d`).
    const hash =
      url.searchParams.get("h") ?? (host === "vimeo.com" ? segments[1] : undefined);
    const privacy = hash && vimeoHash.test(hash) ? `h=${hash}&` : "";
    return `https://player.vimeo.com/video/${id}?${privacy}autoplay=1`;
  }

  return null;
}
