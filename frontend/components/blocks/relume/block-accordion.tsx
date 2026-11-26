"use client";

// The accordion of a block imported from Relume: Radix Accordion, as
// Relume's own `@/components/ui/accordion`, with Relume's default classes in
// the Starter's job tokens. The converter writes these in place of Relume's
// parts (see "Accordions" in docs/agents/relume-import.md) and passes each
// part the component's own classes, which replace a default of the same
// property. The site's own accordion (`@/components/ui/accordion`, used by
// the header and the post sidebar) keeps its look.
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function BlockAccordion(props: ComponentProps<typeof Accordion.Root>) {
  return <Accordion.Root {...props} />;
}

export function BlockAccordionItem({
  className,
  ...props
}: ComponentProps<typeof Accordion.Item>) {
  return (
    <Accordion.Item
      className={cn("border-b border-border first:border-t", className)}
      {...props}
    />
  );
}

export function BlockAccordionTrigger({
  className,
  children,
  icon = (
    <ChevronDown
      aria-hidden="true"
      className="pointer-events-none size-7 shrink-0 text-foreground transition-transform duration-300 md:size-8"
    />
  ),
  ...props
}: ComponentProps<typeof Accordion.Trigger> & {
  /** The icon after the question, which turns as the answer opens. */
  icon?: ReactNode;
}) {
  return (
    <Accordion.Header className="flex w-full">
      <Accordion.Trigger
        className={cn(
          "flex flex-1 items-center justify-between gap-4 rounded-control py-4 text-left font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&[data-state=open]>svg]:rotate-180",
          className,
        )}
        {...props}
      >
        {children}
        {icon}
      </Accordion.Trigger>
    </Accordion.Header>
  );
}

export function BlockAccordionContent({
  className,
  children,
  ...props
}: ComponentProps<typeof Accordion.Content>) {
  return (
    <Accordion.Content
      className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={cn("pb-5", className)}>{children}</div>
    </Accordion.Content>
  );
}
