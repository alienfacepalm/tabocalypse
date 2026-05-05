import { describe, expect, it } from "vitest";
import { coerceAlarmMetaMessage } from "./alarm-meta-message";

describe("coerceAlarmMetaMessage", () => {
  it("returns plain strings unchanged", () => {
    expect(coerceAlarmMetaMessage("hello")).toBe("hello");
  });

  it("stringifies notification-shaped objects instead of leaking them to React children", () => {
    expect(coerceAlarmMetaMessage({ message: "m", title: "t" })).toBe("t: m");
    expect(coerceAlarmMetaMessage({ message: "only-msg" })).toBe("only-msg");
    expect(coerceAlarmMetaMessage({ title: "only-title" })).toBe("only-title");
  });

  it("handles empty-ish values", () => {
    expect(coerceAlarmMetaMessage(null)).toBe("");
    expect(coerceAlarmMetaMessage(undefined)).toBe("");
  });

  it("falls back for unknown shapes", () => {
    expect(coerceAlarmMetaMessage(42)).toBe("42");
    expect(coerceAlarmMetaMessage({})).toBe("{}");
    expect(coerceAlarmMetaMessage([1, 2])).toBe("[1,2]");
  });
});
