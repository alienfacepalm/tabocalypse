import { describe, expect, it } from "vitest";
import { coerceClockHourFormat } from "./clock-hour-format";

describe("coerceClockHourFormat", () => {
  it("returns valid literals unchanged", () => {
    expect(coerceClockHourFormat("12h", "24h")).toBe("12h");
    expect(coerceClockHourFormat("24h", "12h")).toBe("24h");
  });

  it("falls back for unknown values", () => {
    expect(coerceClockHourFormat("am/pm", "24h")).toBe("24h");
    expect(coerceClockHourFormat(1, "12h")).toBe("12h");
    expect(coerceClockHourFormat(undefined, "24h")).toBe("24h");
  });
});
