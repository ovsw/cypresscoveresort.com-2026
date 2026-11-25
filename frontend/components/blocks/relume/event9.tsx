// Hand-finished from relume/source/event9.tsx (Relume Event 9): the
// converter cannot carry over the event cards, which the original draws with
// a helper component, a badge and a link held as a plain string. Each event
// links to its page through the shared `button` object (its label is the
// link under the description), and its date is a date field drawn as the
// original's weekday, day, and month and year. Listed under "Hand-finished
// blocks" in docs/agents/relume-import.md; do not regenerate.
import {
  BlockButtons,
  type BlockButtonRole,
} from "@/components/blocks/relume/block-buttons";
import { BlockImage } from "@/components/blocks/relume/block-image";
import { Button } from "@/components/ui/button";
import { getSafeLinkHref } from "@/lib/safe-href";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { ChevronRight } from "lucide-react";
import { stegaClean } from "next-sanity";
import Link from "next/link";
import {
  resolveBlockTheme,
  blockSceneClassName,
  type BlockSceneProps,
} from "../block-boundaries";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type RelumeEvent9Block = Extract<PageBlock, { _type: "relumeEvent9" }>;

type RelumeEvent9Props = RelumeEvent9Block & {
  dataAttribute?: (path: string) => string | undefined;
} & BlockSceneProps;

// The block's one button is Relume's secondary button.
const buttonsRoles: BlockButtonRole[] = [{ variant: "outline" }];

// The date as the original prints it: "Fri", "09", "Feb 2024". A date field
// holds a day with no time, so it is read and printed in UTC, never shifted
// by the server's time zone.
function eventDate(value: string | null | undefined) {
  const iso = stegaClean(value)?.trim();
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  const format = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...options }).format(
      date,
    );
  return {
    iso,
    weekday: format({ weekday: "short" }),
    day: format({ day: "2-digit" }),
    monthYear: format({ month: "short", year: "numeric" }),
  };
}

// The Page Builder excludes blocks without content from visible adjacency.
// Keep this rule aligned with the renderer's empty result below.
export function hasRelumeEvent9Content(
  block: Pick<RelumeEvent9Block, "heading">,
) {
  return Boolean(stegaClean(block.heading)?.trim());
}

export default function RelumeEvent9({
  _key,
  bottom = "outer",
  dataAttribute,
  tagline,
  heading,
  description,
  buttons,
  events,
  theme,
  top = "outer",
}: RelumeEvent9Props) {
  if (!hasRelumeEvent9Content({ heading })) return null;

  const headingId = `relume-event9-${stegaClean(_key)}-heading`;
  // Studio requires each event's date, title and link; an event written
  // through the API without them is left out.
  const items = (events ?? []).flatMap((event) => {
    const date = eventDate(event.date);
    const href = getSafeLinkHref(event.link?.href);
    const label = stegaClean(event.link?.text)?.trim();
    if (!date || !href || !label || !stegaClean(event.title)?.trim()) {
      return [];
    }
    const newTab = Boolean(stegaClean(event.link?.openInNewTab));
    return [{ ...event, date, href, newTab }];
  });

  return (
    <section
      aria-labelledby={headingId}
      className={blockSceneClassName(resolveBlockTheme(theme), top, bottom)}
      data-sanity={dataAttribute?.("theme")}
    >
      <div className="container">
        <div className="mb-12 grid grid-cols-1 items-end gap-12 md:mb-18 md:grid-cols-[1fr_max-content] lg:mb-20 lg:gap-20">
          <div className="max-w-[48rem]">
            {stegaClean(tagline)?.trim() ? (
              <p
                className="mb-3 font-semibold md:mb-4"
                data-sanity={dataAttribute?.("tagline")}
              >
                {tagline}
              </p>
            ) : null}
            <h2
              className="mb-3 typo-block-heading md:mb-4"
              data-sanity={dataAttribute?.("heading")}
              id={headingId}
            >
              {heading}
            </h2>
            {stegaClean(description)?.trim() ? (
              <p
                className="typo-body-editorial whitespace-pre-line"
                data-sanity={dataAttribute?.("description")}
              >
                {description}
              </p>
            ) : null}
          </div>
          <BlockButtons
            buttons={buttons}
            className="hidden md:flex"
            dataAttribute={dataAttribute}
            roles={buttonsRoles}
          />
        </div>
        <ul
          className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 md:gap-y-16 lg:grid-cols-3"
          data-sanity={dataAttribute?.("events")}
        >
          {items.map((event) => {
            const path = `events[_key=="${event._key}"]`;
            const linkProps = {
              href: event.href,
              rel: event.newTab ? "noopener noreferrer" : undefined,
              target: event.newTab ? "_blank" : undefined,
            };
            return (
              <li className="flex flex-col items-start" key={event._key}>
                <div className="relative w-full">
                  {/* The photo repeats the title's link, so it is left out
                      of the tab order and of what a screen reader lists.
                      The date sits beside it, not inside, so a screen
                      reader still reads it. */}
                  <Link
                    {...linkProps}
                    aria-hidden="true"
                    className="relative block aspect-[3/2] w-full overflow-hidden rounded-card"
                    tabIndex={-1}
                  >
                    <BlockImage
                      className="absolute size-full rounded-card object-cover"
                      dataSanity={dataAttribute?.(`${path}.image`)}
                      image={event.image}
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    />
                  </Link>
                  <time
                    className="absolute top-4 right-4 flex min-w-28 flex-col items-center rounded-card bg-card px-1 py-3 typo-body-sm text-card-foreground"
                    data-sanity={dataAttribute?.(`${path}.date`)}
                    dateTime={event.date.iso}
                  >
                    <span>{event.date.weekday}</span>
                    <span className="typo-block-subheading">
                      {event.date.day}
                    </span>
                    <span>{event.date.monthYear}</span>
                  </time>
                </div>
                <div className="mt-5 flex flex-col items-start md:mt-6">
                  {stegaClean(event.category)?.trim() ? (
                    <p
                      className="mb-3 inline-flex items-center rounded-control bg-muted px-2.5 py-1 typo-body-sm font-semibold text-foreground md:mb-4"
                      data-sanity={dataAttribute?.(`${path}.category`)}
                    >
                      {event.category}
                    </p>
                  ) : null}
                  <h3
                    className="typo-block-subheading"
                    data-sanity={dataAttribute?.(`${path}.title`)}
                  >
                    <Link
                      {...linkProps}
                      className="rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {event.title}
                    </Link>
                  </h3>
                  {stegaClean(event.location)?.trim() ? (
                    <p
                      className="mb-2"
                      data-sanity={dataAttribute?.(`${path}.location`)}
                    >
                      {event.location}
                    </p>
                  ) : null}
                  {stegaClean(event.description)?.trim() ? (
                    <p
                      className="whitespace-pre-line"
                      data-sanity={dataAttribute?.(`${path}.description`)}
                    >
                      {event.description}
                    </p>
                  ) : null}
                  {/* Relume's link-style button: no side padding, so the
                      label lines up with the text above it. */}
                  <Button asChild className="mt-5 px-0 md:mt-6" variant="link">
                    <Link
                      {...linkProps}
                      data-sanity={dataAttribute?.(`${path}.link`)}
                    >
                      {event.link?.text}
                      <ChevronRight
                        aria-hidden="true"
                        className="text-foreground"
                      />
                    </Link>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
        <BlockButtons
          buttons={buttons}
          className="mt-12 flex justify-end md:mt-14 md:hidden"
          dataAttribute={dataAttribute}
          roles={buttonsRoles}
        />
      </div>
    </section>
  );
}
