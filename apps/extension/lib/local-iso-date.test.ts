import { describe, expect, it } from "vitest";
import {
  isIsoDateString,
  isoDateLocal,
  isoDateToDayNumber,
  msUntilNextLocalMidnight,
  previousIsoDateLocal,
} from "./local-iso-date";

describe("isoDateLocal", () => {
  it("formats local calendar parts with zero padding", () => {
    expect(isoDateLocal(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
  });
});

describe("previousIsoDateLocal", () => {
  it("crosses month, leap-day, and year boundaries", () => {
    expect(previousIsoDateLocal("2026-03-01")).toBe("2026-02-28");
    expect(previousIsoDateLocal("2024-03-01")).toBe("2024-02-29");
    expect(previousIsoDateLocal("2026-01-01")).toBe("2025-12-31");
  });
});

describe("isoDateToDayNumber", () => {
  it("counts days since the epoch", () => {
    expect(isoDateToDayNumber("1970-01-01")).toBe(0);
    expect(isoDateToDayNumber("1970-01-02")).toBe(1);
  });

  it("differs by exactly one across DST transitions", () => {
    expect(isoDateToDayNumber("2026-03-08") - isoDateToDayNumber("2026-03-07")).toBe(1);
    expect(isoDateToDayNumber("2026-11-01") - isoDateToDayNumber("2026-10-31")).toBe(1);
  });

  it("returns 0 for malformed input", () => {
    expect(isoDateToDayNumber("not-a-date")).toBe(0);
    expect(isoDateToDayNumber("")).toBe(0);
  });
});

describe("isIsoDateString", () => {
  it("accepts YYYY-MM-DD only", () => {
    expect(isIsoDateString("2026-09-11")).toBe(true);
    expect(isIsoDateString("2026-9-11")).toBe(false);
    expect(isIsoDateString(20260911)).toBe(false);
  });
});

describe("msUntilNextLocalMidnight", () => {
  it("is the remaining time in the local day", () => {
    expect(msUntilNextLocalMidnight(new Date(2026, 0, 5, 23, 59, 0))).toBe(60_000);
    expect(msUntilNextLocalMidnight(new Date(2026, 0, 5, 0, 0, 0))).toBe(86_400_000);
  });
});
