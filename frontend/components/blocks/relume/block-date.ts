// The date of a block imported from Relume. Relume writes a date as text in
// parts (`{ weekday: "Sat", day: "09", monthYear: "Feb 2024" }`); the block
// holds one Sanity date (`2024-02-09`) and prints it in the same parts, as
// the hand-finished event9 does. See "Dates" in docs/agents/relume-import.md.
import { stegaClean } from "next-sanity";

export type BlockDatePart = "weekday" | "day" | "month" | "year" | "monthYear";

const partFormats: Record<BlockDatePart, Intl.DateTimeFormatOptions> = {
  weekday: { weekday: "short" },
  day: { day: "2-digit" },
  month: { month: "short" },
  year: { year: "numeric" },
  monthYear: { month: "short", year: "numeric" },
};

/**
 * One part of a date, in English as Relume prints it. The date is a day, not
 * a moment, so it is read and printed in UTC: the visitor's or the server's
 * time zone never moves it to the day before. Studio requires the date; a
 * value that is not one prints nothing.
 */
export function blockDatePart(
  value: string | null | undefined,
  part: BlockDatePart,
) {
  const iso = stegaClean(value)?.trim();
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    ...partFormats[part],
  }).format(date);
}
