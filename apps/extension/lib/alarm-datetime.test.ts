import { describe, expect, it } from "vitest";
import {
  defaultAlarmWhenLocal,
  formatAlarmScheduledLabel,
  formatDatetimeLocalFromDate,
} from "./alarm-datetime";

describe("formatDatetimeLocalFromDate", () => {
  it("formats local date and time with minute precision", () => {
    const d = new Date(2026, 4, 4, 9, 7);
    expect(formatDatetimeLocalFromDate(d)).toBe("2026-05-04T09:07");
  });
});

describe("defaultAlarmWhenLocal", () => {
  it("returns the next minute boundary after the reference time", () => {
    const fixed = new Date(2026, 11, 7, 8, 0, 30);
    expect(defaultAlarmWhenLocal(fixed)).toBe("2026-12-07T08:01");
  });
});

describe("formatAlarmScheduledLabel", () => {
  const when = new Date(2026, 5, 9, 15, 15, 0);

  it("uses 24-hour time when the global clock format is 24h", () => {
    expect(formatAlarmScheduledLabel(when, "en-US", "24h")).toBe("6/9/2026, 15:15:00");
  });

  it("uses 12-hour time when the global clock format is 12h", () => {
    expect(formatAlarmScheduledLabel(when, "en-US", "12h")).toBe("6/9/2026, 03:15:00 PM");
  });
});
