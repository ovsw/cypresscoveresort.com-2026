"use client";

import { useEffect, useState, useTransition } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { disableDraftMode } from "@/app/actions/disable-draft-mode";

export function DisableDraftMode() {
  const [pending, startTransition] = useTransition();
  // null until the browser says whether the page sits in a frame.
  const [isInIframe, setIsInIframe] = useState<boolean | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Defer iframe detection until the browser is available.
    setIsInIframe(window.self !== window.top);
  }, []);

  // Hidden only inside the Presentation preview pane, which is an iframe and
  // has its own controls. A tab opened from Presentation still counts as
  // "Presentation" to Sanity, but editors browse the site there, so it keeps
  // the button.
  if (isInIframe !== false) return null;

  return (
    <button
      className={cn(
        buttonVariants({ size: "compact" }),
        "fixed z-9999 bottom-4 right-4 cursor-pointer",
      )}
      disabled={pending}
      onClick={() => startTransition(() => disableDraftMode())}
    >
      {pending ? "Disabling..." : "Disable preview mode"}
    </button>
  );
}
