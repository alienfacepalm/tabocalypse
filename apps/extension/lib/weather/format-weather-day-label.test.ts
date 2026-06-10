import { describe, expect, it } from "vitest";
import { formatWeatherDayLabel } from "./format-weather-day-label";

describe("formatWeatherDayLabel", () => {
  it("formats a weekday from an ISO date", () => {
    const label = formatWeatherDayLabel("2026-06-09", "en-US");
    expect(label.length).toBeGreaterThan(0);
    expect(label).not.toContain("2026");
  });
});
