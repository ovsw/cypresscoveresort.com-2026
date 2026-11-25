"use client";

// The tabs of a block imported from Relume: Radix Tabs, as Relume's own
// `@/components/ui/tabs`. The converter writes these in place of Relume's
// (see "Tabs" in docs/agents/relume-import.md) and gives each part its full
// class list, Relume's defaults included, so these add only what every tab
// needs whatever its look: a visible focus ring and the disabled state.
import * as Tabs from "@radix-ui/react-tabs";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function BlockTabs(props: ComponentProps<typeof Tabs.Root>) {
  return <Tabs.Root {...props} />;
}

export function BlockTabsList(props: ComponentProps<typeof Tabs.List>) {
  return <Tabs.List {...props} />;
}

export function BlockTabsTrigger({
  className,
  ...props
}: ComponentProps<typeof Tabs.Trigger>) {
  return (
    <Tabs.Trigger
      className={cn(
        focusRing,
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function BlockTabsContent({
  className,
  ...props
}: ComponentProps<typeof Tabs.Content>) {
  return <Tabs.Content className={cn(focusRing, className)} {...props} />;
}
