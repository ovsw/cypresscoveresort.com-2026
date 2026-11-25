"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Whether a CSS media query matches, such as `"(max-width: 767px)"`. It is
 * false on the server and until the page has hydrated, so a block that
 * reads it draws its wide-screen form first. Blocks imported from Relume
 * use it to switch a scroll animation off on a phone (Header 143).
 */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
