import { describe, expect, it } from "vitest";
import {
  validateTabocalypseAlarmExistingName,
  validateTabocalypseAlarmWhenMs,
} from "./tabocalypse-alarm-validation";

describe("validateTabocalypseAlarmWhenMs", () => {
  const now = Date.parse("2026-06-09T15:00:00");

  it("accepts a future timestamp", () => {
    expect(validateTabocalypseAlarmWhenMs(now + 60_000, now)).toBeNull();
  });

  it("rejects invalid timestamps", () => {
    expect(validateTabocalypseAlarmWhenMs(Number.NaN, now)).toBe(
      "That date and time is not valid.",
    );
  });

  it("rejects past timestamps", () => {
    expect(validateTabocalypseAlarmWhenMs(now - 1, now)).toBe("Pick a time in the future.");
  });
});

describe("validateTabocalypseAlarmExistingName", () => {
  it("accepts Tabocalypse alarm ids", () => {
    expect(validateTabocalypseAlarmExistingName("tabocalypse:abc")).toBeNull();
  });

  it("rejects foreign alarm ids on edit", () => {
    expect(validateTabocalypseAlarmExistingName("other:alarm")).toBe(
      "That alarm could not be updated.",
    );
  });
});
