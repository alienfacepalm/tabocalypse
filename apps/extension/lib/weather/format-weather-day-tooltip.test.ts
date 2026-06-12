import { describe, expect, it } from "vitest";
import { formatWeatherDayTooltip } from "./format-weather-day-tooltip";

describe("formatWeatherDayTooltip", () => {
  it("includes a long date and condition summary", () => {
    const tip = formatWeatherDayTooltip("2026-06-11", "en-US", "Overcast");
    expect(tip).toContain("2026");
    expect(tip).toContain("Overcast");
    expect(tip).toContain("·");
  });
});
