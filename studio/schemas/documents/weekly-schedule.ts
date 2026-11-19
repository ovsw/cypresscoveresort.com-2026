import { CalendarClock } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import { requiredText } from "../validation/required-text";

export const WEEKDAYS = [
  { name: "monday", title: "Monday" },
  { name: "tuesday", title: "Tuesday" },
  { name: "wednesday", title: "Wednesday" },
  { name: "thursday", title: "Thursday" },
  { name: "friday", title: "Friday" },
  { name: "saturday", title: "Saturday" },
  { name: "sunday", title: "Sunday" },
] as const;

const scheduleEntry = defineType({
  name: "scheduleEntry",
  title: "Schedule entry",
  type: "object",
  fields: [
    defineField({
      name: "time",
      title: "Time",
      type: "string",
      description: "When it starts, as it should read.",
      placeholder: "e.g. 9 AM",
      validation: (rule) => requiredText(rule),
    }),
    defineField({
      name: "activity",
      title: "Activity",
      type: "string",
      description: "The activity or club meeting.",
      placeholder: "e.g. Water aerobics",
      validation: (rule) => requiredText(rule),
    }),
    defineField({
      name: "place",
      title: "Place",
      type: "string",
      description: "Where on the resort it happens.",
      placeholder: "e.g. Main pool",
    }),
    defineField({
      name: "note",
      title: "Note",
      type: "string",
      description: "Optional. A detail guests should know.",
      placeholder: "e.g. Bring your own paddle",
    }),
  ],
  preview: {
    select: { activity: "activity", place: "place", time: "time" },
    prepare: ({ activity, place, time }) => ({
      title: [time, activity].filter(Boolean).join(" · "),
      subtitle: place,
    }),
  },
});

const weeklySchedule = defineType({
  name: "weeklySchedule",
  title: "Weekly schedule",
  type: "document",
  icon: CalendarClock,
  description:
    "The activities and club meetings that repeat every week. Dated events are Event records.",
  fields: WEEKDAYS.map((day) =>
    defineField({
      name: day.name,
      title: day.title,
      type: "array",
      description: `What happens every ${day.title}, in the order it happens.`,
      of: [defineArrayMember({ type: "scheduleEntry" })],
    }),
  ),
  preview: { prepare: () => ({ title: "Weekly schedule" }) },
});

export const weeklyScheduleSchemaTypes = [scheduleEntry];

export default weeklySchedule;
