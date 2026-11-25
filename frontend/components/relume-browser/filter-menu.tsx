"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { CheckIcon, ChevronDownIcon, CircleHelpIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { nextFilterHref, settleFilterHref } from "@/lib/relume-filter-url";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/** One row: a checkbox, a toggle switch or a radio choice. */
export type FilterMenuItem = {
  type: "checkbox" | "switch" | "radio";
  label: string;
  checked: boolean;
  /** The page URL with this row toggled; built on the server. */
  href: string;
  count?: number;
  help?: string;
};

export type FilterMenuGroup = { heading?: string; items: FilterMenuItem[] };

function Indicator({ type, checked }: { type: FilterMenuItem["type"]; checked: boolean }) {
  if (type === "switch") {
    return (
      <span
        aria-hidden
        className={cn(
          "relative inline-flex h-4 w-7 shrink-0 rounded-full transition-colors",
          checked ? "bg-zinc-900" : "bg-zinc-300",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-3 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-3.5" : "translate-x-0.5",
          )}
        />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-4 shrink-0 items-center justify-center border",
        type === "radio" ? "rounded-full" : "rounded-sm",
        checked ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-400 bg-white",
      )}
    >
      {checked ? (
        type === "radio" ? (
          <span className="size-1.5 rounded-full bg-white" />
        ) : (
          <CheckIcon className="size-3" strokeWidth={3} />
        )
      ) : null}
    </span>
  );
}

/**
 * A filter button with a popover of checkboxes, switches or radio choices and
 * a Clear button. Every row navigates to the URL the server built for it; the
 * menu stays open so several boxes can be ticked in a row.
 */
export function FilterMenu({
  label,
  active,
  groups,
  clearHref,
  currentHref,
}: {
  label: string;
  /** The page URL for the filters the server rendered. */
  currentHref: string;
  /** Selections held; shown on the button when above 0. */
  active: number;
  groups: FilterMenuGroup[];
  clearHref: string;
}) {
  const router = useRouter();
  // Each row's URL is built from the filters the server last rendered. A row
  // clicked before an earlier click has landed applies only its own change on
  // top of the URL that click asked for, so neither tick is dropped.
  const [, startTransition] = useTransition();
  useEffect(() => settleFilterHref(currentHref), [currentHref]);
  const go = (href: string) => {
    const next = nextFilterHref(currentHref, href);
    startTransition(() => router.push(next, { scroll: false }));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium shadow-xs transition-colors",
          active
            ? "border-zinc-900 bg-white text-zinc-900"
            : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500",
        )}
        data-filter-menu={label}
      >
        {label}
        {active ? (
          <span className="rounded-full bg-zinc-900 px-1.5 text-xs leading-5 text-white tabular-nums">
            {active}
          </span>
        ) : null}
        <ChevronDownIcon className="size-4 text-zinc-500" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-[70vh] w-72 overflow-y-auto bg-white p-0 text-zinc-900"
        aria-label={`${label} filters`}
      >
        <div className="p-1">
          {groups.map((group, index) => (
            <DropdownMenuPrimitive.Group key={group.heading ?? index}>
              {index > 0 ? <DropdownMenuSeparator /> : null}
              {group.heading ? (
                <DropdownMenuLabel className="pb-1 text-xs font-medium text-zinc-500">
                  {group.heading}
                </DropdownMenuLabel>
              ) : null}
              {group.items.map((item) => (
                <DropdownMenuPrimitive.CheckboxItem
                  key={item.label}
                  checked={item.checked}
                  // A radio row is still one tick among exclusive choices.
                  role={item.type === "radio" ? "menuitemradio" : undefined}
                  onSelect={(event) => {
                    event.preventDefault();
                    go(item.href);
                  }}
                  className="flex cursor-default items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-zinc-100"
                  data-filter-option={item.label}
                >
                  {item.type === "switch" ? null : (
                    <Indicator type={item.type} checked={item.checked} />
                  )}
                  <span className="flex flex-1 items-center gap-1.5">
                    {item.label}
                    {item.help ? (
                      <span title={item.help} className="text-zinc-400">
                        <CircleHelpIcon className="size-3.5" aria-label={item.help} />
                      </span>
                    ) : null}
                  </span>
                  {item.count !== undefined ? (
                    <span className="text-xs text-zinc-500 tabular-nums">{item.count}</span>
                  ) : null}
                  {item.type === "switch" ? (
                    <Indicator type="switch" checked={item.checked} />
                  ) : null}
                </DropdownMenuPrimitive.CheckboxItem>
              ))}
            </DropdownMenuPrimitive.Group>
          ))}
        </div>
        <div className="sticky bottom-0 border-t border-zinc-200 bg-white p-1">
          <DropdownMenuItem
            disabled={!active}
            onSelect={(event) => {
              event.preventDefault();
              go(clearHref);
            }}
            className="justify-center font-medium"
          >
            Clear
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
