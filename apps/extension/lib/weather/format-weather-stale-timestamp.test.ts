import { describe, expect, it } from "vitest";
import { formatWeatherStaleTimestamp } from "./format-weather-stale-timestamp";

describe("formatWeatherStaleTimestamp", () => {
  it("formats a locale-aware date and time", () => {
    const formatted = formatWeatherStaleTimestamp(1_718_000_000_000, "en-US");
    expect(formatted.length).toBeGreaterThan(0);
    expect(formatted).toMatch(/2024|Jun|6|11/);
  });
});
