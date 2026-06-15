import { describe, expect, it } from "vitest";
import { formatWeatherDayLabel } from "./format-weather-day-label";

describe("formatWeatherDayLabel", () => {
  it("formats a full weekday from an ISO date", () => {
    const label = formatWeatherDayLabel("2026-06-09", "en-US", "long");
    expect(label).toBe("Tuesday");
    expect(label).not.toContain("2026");
  });

  it("formats a short weekday when layout is tight", () => {
    expect(formatWeatherDayLabel("2026-06-09", "en-US", "short")).toBe("Tue");
  });
});
