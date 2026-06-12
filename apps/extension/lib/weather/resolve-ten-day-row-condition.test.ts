import { describe, expect, it } from "vitest";
import { formatTenDayRowSummary, resolveTenDayRowCondition } from "./resolve-ten-day-row-condition";

const day = {
  date: "2026-06-11",
  code: 3,
  summary: "Overcast",
  high: 72,
  low: 55,
  precipChancePercent: 10,
  precipSum: 0,
  windSpeedMax: 12,
  windDirectionDegrees: 180,
  uvIndexMax: 6,
  sunrise: "2026-06-11T05:30:00",
  sunset: "2026-06-11T20:45:00",
  feelsLikeHigh: 74,
  feelsLikeLow: 54,
};

describe("resolveTenDayRowCondition", () => {
  it("uses live current conditions for today when they differ from the daily outlook", () => {
    const result = resolveTenDayRowCondition(
      day,
      { temperature: 68, temperatureUnit: "fahrenheit", code: 0, summary: "Clear" },
      true,
    );
    expect(result.code).toBe(0);
    expect(result.summary).toBe("Clear");
    expect(result.dailyOutlookSummary).toBe("Overcast");
    expect(formatTenDayRowSummary(result)).toBe("Clear now · Overcast overall");
  });

  it("keeps daily outlook for non-today rows", () => {
    const result = resolveTenDayRowCondition(
      day,
      { temperature: 68, temperatureUnit: "fahrenheit", code: 0, summary: "Clear" },
      false,
    );
    expect(result.code).toBe(3);
    expect(result.summary).toBe("Overcast");
  });
});
