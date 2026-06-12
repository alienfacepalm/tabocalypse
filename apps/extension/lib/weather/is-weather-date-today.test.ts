import { describe, expect, it } from "vitest";
import { isWeatherDateToday } from "./is-weather-date-today";

describe("isWeatherDateToday", () => {
  it("matches YYYY-MM-DD for the same local calendar day", () => {
    expect(isWeatherDateToday("2026-06-11", new Date("2026-06-11T08:00:00"))).toBe(true);
    expect(isWeatherDateToday("2026-06-10", new Date("2026-06-11T08:00:00"))).toBe(false);
  });
});
