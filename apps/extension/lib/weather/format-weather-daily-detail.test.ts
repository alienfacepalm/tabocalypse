import { describe, expect, it } from "vitest";
import {
  formatRelativeHumidityPercent,
  formatPrecipChancePercent,
  formatPrecipSum,
  formatUvIndexMax,
  formatWeatherSunTime,
  formatWindDirectionCompass,
  formatWindSpeedMax,
} from "./format-weather-daily-detail";

describe("formatWindDirectionCompass", () => {
  it("maps degrees to eight-point compass labels", () => {
    expect(formatWindDirectionCompass(0)).toBe("N");
    expect(formatWindDirectionCompass(45)).toBe("NE");
    expect(formatWindDirectionCompass(180)).toBe("S");
    expect(formatWindDirectionCompass(225)).toBe("SW");
  });
});

describe("formatRelativeHumidityPercent", () => {
  it("rounds finite values", () => {
    expect(formatRelativeHumidityPercent(62.4)).toBe("62%");
  });

  it("returns null for missing values", () => {
    expect(formatRelativeHumidityPercent(null)).toBeNull();
  });
});

describe("formatPrecipChancePercent", () => {
  it("rounds finite values", () => {
    expect(formatPrecipChancePercent(42.6)).toBe("43%");
  });

  it("returns null for missing values", () => {
    expect(formatPrecipChancePercent(null)).toBeNull();
  });
});

describe("formatPrecipSum", () => {
  it("uses inch suffix for Fahrenheit preference", () => {
    expect(formatPrecipSum(0.12, "fahrenheit", "en-US")).toBe("0.12 in");
  });

  it("uses mm suffix for Celsius preference", () => {
    expect(formatPrecipSum(4.2, "celsius", "en-US")).toBe("4.2 mm");
  });
});

describe("formatWindSpeedMax", () => {
  it("includes speed, unit, and compass direction", () => {
    expect(formatWindSpeedMax(12, 225, "fahrenheit", "en-US")).toBe("12 mph SW");
  });
});

describe("formatUvIndexMax", () => {
  it("formats UV values", () => {
    expect(formatUvIndexMax(6.2, "en-US")).toBe("6.2");
  });
});

describe("formatWeatherSunTime", () => {
  it("formats local ISO timestamps", () => {
    const formatted = formatWeatherSunTime("2026-06-09T05:42", "en-US");
    expect(formatted).toMatch(/5:42/);
  });
});
