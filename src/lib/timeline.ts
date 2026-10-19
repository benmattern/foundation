import type { TimelineEvent, TimelineFilters } from "../types/timeline";
export const emptyTimelineFilters: TimelineFilters = {
  search: "",
  from: "",
  to: "",
  type: "",
  entity: "",
  question: "",
  source: "",
  article: "",
  order: "asc",
};
export function dateBounds(value: string): [string, string] | null {
  if (!value) return null;
  if (!/^\d{4}(-\d{2})?(-\d{2})?$/.test(value) || Number(value.slice(0, 4)) < 1)
    throw new Error("Use YYYY, YYYY-MM or YYYY-MM-DD.");
  const year = Number(value.slice(0, 4)),
    month = value.length >= 7 ? Number(value.slice(5, 7)) : 1;
  const day = value.length === 10 ? Number(value.slice(8, 10)) : 1;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month < 1 || month > 12 || day < 1 || day > days[month - 1])
    throw new Error("This calendar date does not exist.");
  const start = `${value.slice(0, 4)}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return [
    start,
    value.length === 4
      ? `${value}-12-31`
      : value.length === 7
        ? `${value}-${days[month - 1]}`
        : start,
  ];
}
export function validateChronology(start: string, end: string) {
  const lower = dateBounds(start),
    upper = dateBounds(end);
  if (upper && !lower) throw new Error("A date range needs a start.");
  if (lower && upper && upper[1] < lower[0])
    throw new Error("The range ends before its start.");
}
export function eventDateLabel(
  event: Pick<
    TimelineEvent,
    | "date_start"
    | "date_end"
    | "date_approximate"
    | "date_origin"
    | "occurred_at"
  >,
) {
  if (event.date_origin === "legacy_timestamp" && event.occurred_at)
    return `Legacy timestamp: ${event.occurred_at} (UTC grouping)`;
  if (!event.date_start) return "Date unknown";
  return `${event.date_approximate ? "Approximately " : ""}${event.date_start}${event.date_end ? ` to ${event.date_end}` : ""}`;
}
export function eventGroup(event: Pick<TimelineEvent, "date_start">) {
  const date = event.date_start;
  return {
    year: date?.slice(0, 4) ?? "Undated",
    month: !date
      ? ""
      : date.length === 4
        ? "Month unknown"
        : new Intl.DateTimeFormat("en", {
            month: "long",
            timeZone: "UTC",
          }).format(new Date(`${date.slice(0, 7)}-01T00:00:00Z`)),
  };
}
export function readTimelineFilters(params: URLSearchParams): TimelineFilters {
  return Object.fromEntries(
    Object.entries(emptyTimelineFilters).map(([key, fallback]) => [
      key,
      key === "order"
        ? params.get(key) === "desc"
          ? "desc"
          : "asc"
        : (params.get(key) ?? fallback),
    ]),
  ) as TimelineFilters;
}
export function timelineReturnPath(value: string | null): string {
  if (value?.startsWith("/events?") || value === "/events") return value;
  return "/events";
}
