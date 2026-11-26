"use client";

import { useEffect } from "react";

// Sanity's preview overlay puts two labels above a hovered element: the
// document name on the left and "Open in Studio" on the right. Only the second
// is a link, and on a small element, such as a footer link, the name label
// covers it. This makes a click on the name label open the same Studio link.
// Inside the Presentation pane there is no Studio link, so nothing changes.
export function OverlayTitleLink() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const overlay = event.target.closest("[data-sanity-overlay-element]");
      // Leave the overlay's own links, buttons and menus alone.
      if (!overlay || event.target.closest("a, button, [role='menu']")) return;
      const studioLink = overlay.querySelector<HTMLAnchorElement>(
        "a[href*='/intent/edit/']",
      );
      const label = [...overlay.children].find((child) =>
        child.contains(event.target as Node),
      );
      if (!studioLink || !label || label.contains(studioLink)) return;
      event.preventDefault();
      studioLink.click();
    }

    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  return null;
}
