import { describe, expect, it } from "vitest";
import { defaultAlarmWhenLocal, formatDatetimeLocalFromDate } from "./alarm-datetime";

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
