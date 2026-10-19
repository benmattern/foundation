import { expect, it } from "vitest";
import {
  dateBounds,
  eventDateLabel,
  eventGroup,
  timelineReturnPath,
  validateChronology,
} from "../src/lib/timeline";
import { formatEventOccurrence, getEventDate } from "../src/lib/eventMetrics";
import type { FoundationEvent } from "../src/types/event";

it("keeps calendar precision, leap rules and uncertainty distinct from sort bounds", () => {
  expect(dateBounds("2024-02")).toEqual(["2024-02-01", "2024-02-29"]);
  expect(dateBounds("1900-02")).toEqual(["1900-02-01", "1900-02-28"]);
  expect(dateBounds("0001")).toEqual(["0001-01-01", "0001-12-31"]);
  for (const date of [
    "0000",
    "2023-02-29",
    "2024-13",
    "2024-01-00",
    "24-01-01",
  ])
    expect(() => dateBounds(date)).toThrow();
  expect(() => validateChronology("", "2024")).toThrow();
  expect(() => validateChronology("2024-05", "2024-04")).toThrow();
  expect(
    eventDateLabel({
      date_start: "2024",
      date_end: "2025-02",
      date_approximate: true,
      date_origin: "explicit",
      occurred_at: null,
    }),
  ).toBe("Approximately 2024 to 2025-02");
  expect(eventGroup({ date_start: "2024" })).toEqual({
    year: "2024",
    month: "Month unknown",
  });
  expect(eventGroup({ date_start: null })).toEqual({
    year: "Undated",
    month: "",
  });
  expect(
    eventDateLabel({
      date_start: null,
      date_end: null,
      date_approximate: false,
      date_origin: "explicit",
      occurred_at: "2024-01-01",
    }),
  ).toBe("Date unknown");
});
it("preserves timeline filters in local return navigation", () => {
  expect(timelineReturnPath("/events?entity=fixture&order=desc")).toBe(
    "/events?entity=fixture&order=desc",
  );
  expect(timelineReturnPath("//example.com/events")).toBe("/events");
  expect(timelineReturnPath("/events-other")).toBe("/events");
});

it("dashboard occurrence labels preserve precision and explicit unknown dates over original timestamps", () => {
  const event = {
    date_start: "2024",
    date_end: null,
    timeline_start: "2024-01-01",
    occurred_at: "2020-02-01T12:00:00Z",
  } as FoundationEvent;
  expect(formatEventOccurrence(event)).toBe("2024");
  expect(getEventDate(event)?.toISOString()).toBe("2024-01-01T00:00:00.000Z");
  const unknown = { ...event, date_start: null, timeline_start: null };
  expect(getEventDate(unknown)).toBeNull();
  expect(formatEventOccurrence(unknown)).toBe("Date unknown");
});
