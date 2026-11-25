import assert from "node:assert/strict";
import test from "node:test";

import { videoEmbedUrl } from "./video-link.ts";

test("a YouTube link in any of its forms plays from the no-cookie player", () => {
  const player = "https://www.youtube-nocookie.com/embed/8DKLYsikxTs?autoplay=1";
  for (const link of [
    "https://www.youtube.com/watch?v=8DKLYsikxTs",
    "https://www.youtube.com/watch?v=8DKLYsikxTs&t=42s",
    "https://m.youtube.com/watch?v=8DKLYsikxTs",
    "https://youtu.be/8DKLYsikxTs?si=abc",
    "https://www.youtube.com/embed/8DKLYsikxTs?si=Ch9W0KrDWWUiCMMW",
    "https://www.youtube.com/shorts/8DKLYsikxTs",
    "https://www.youtube-nocookie.com/embed/8DKLYsikxTs",
    "  https://youtu.be/8DKLYsikxTs  ",
  ]) {
    assert.equal(videoEmbedUrl(link), player, link);
  }
});

test("a Vimeo link plays from Vimeo's player", () => {
  const player = "https://player.vimeo.com/video/123456789?autoplay=1";
  assert.equal(videoEmbedUrl("https://vimeo.com/123456789"), player);
  assert.equal(videoEmbedUrl("https://player.vimeo.com/video/123456789"), player);
  // An unlisted video keeps its privacy hash, without which it does not play.
  const unlisted = "https://player.vimeo.com/video/123456789?h=5e2d1c1e6d&autoplay=1";
  assert.equal(videoEmbedUrl("https://player.vimeo.com/video/123456789?h=5e2d1c1e6d"), unlisted);
  assert.equal(videoEmbedUrl("https://vimeo.com/123456789/5e2d1c1e6d"), unlisted);
  assert.equal(videoEmbedUrl("https://vimeo.com/123456789?h=not-a-hash"), player);
});

test("anything else is not a video link", () => {
  for (const link of [
    undefined,
    null,
    "",
    "not a link",
    "https://example.com/watch?v=8DKLYsikxTs",
    "https://notyoutube.com/watch?v=8DKLYsikxTs",
    "https://youtube.com.example.org/watch?v=8DKLYsikxTs",
    "https://www.youtube.com/",
    "https://www.youtube.com/watch",
    "https://www.youtube.com/@channel",
    "https://vimeo.com/channels/staffpicks",
    "javascript:alert(1)",
    "https://d22po4pjz3o32e.cloudfront.net/placeholder-video.mp4",
    'https://youtu.be/"><script>',
  ]) {
    assert.equal(videoEmbedUrl(link), null, String(link));
  }
});
