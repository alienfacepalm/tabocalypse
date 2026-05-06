import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FAHRENHEIT_WEATHER_ISO_REGIONS,
  inferWeatherTemperatureUnitFromNavigator,
  resolveEffectiveClockHourFormat,
  resolveEffectiveWeatherTemperatureUnit,
} from "./locale-units";

describe("FAHRENHEIT_WEATHER_ISO_REGIONS", () => {
  it("includes major Fahrenheit-using jurisdictions", () => {
    expect(FAHRENHEIT_WEATHER_ISO_REGIONS.has("US")).toBe(true);
    expect(FAHRENHEIT_WEATHER_ISO_REGIONS.has("PR")).toBe(true);
    expect(FAHRENHEIT_WEATHER_ISO_REGIONS.has("KY")).toBe(true);
    expect(FAHRENHEIT_WEATHER_ISO_REGIONS.has("DE")).toBe(false);
    expect(FAHRENHEIT_WEATHER_ISO_REGIONS.has("JP")).toBe(false);
  });
});

describe("resolveEffectiveWeatherTemperatureUnit", () => {
  it("returns stored unit when automatic matching is off", () => {
    expect(
      resolveEffectiveWeatherTemperatureUnit({
        weatherTemperatureUnitAuto: false,
        weatherTemperatureUnit: "celsius",
      }),
    ).toBe("celsius");
    expect(
      resolveEffectiveWeatherTemperatureUnit({
        weatherTemperatureUnitAuto: false,
        weatherTemperatureUnit: "fahrenheit",
      }),
    ).toBe("fahrenheit");
  });
});

describe("resolveEffectiveClockHourFormat", () => {
  it("returns stored format when automatic matching is off", () => {
    expect(
      resolveEffectiveClockHourFormat({
        clockHourFormatAuto: false,
        clockHourFormat: "24h",
      }),
    ).toBe("24h");
    expect(
      resolveEffectiveClockHourFormat({
        clockHourFormatAuto: false,
        clockHourFormat: "12h",
      }),
    ).toBe("12h");
  });
});

describe("inferWeatherTemperatureUnitFromNavigator", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("infers Fahrenheit for typical US locale tags", () => {
    vi.stubGlobal("navigator", { language: "en-US" });
    expect(inferWeatherTemperatureUnitFromNavigator()).toBe("fahrenheit");
  });

  it("infers Celsius for typical EU locale tags", () => {
    vi.stubGlobal("navigator", { language: "de-DE" });
    expect(inferWeatherTemperatureUnitFromNavigator()).toBe("celsius");
  });

  it("infers Celsius for typical Japanese locale tags", () => {
    vi.stubGlobal("navigator", { language: "ja-JP" });
    expect(inferWeatherTemperatureUnitFromNavigator()).toBe("celsius");
  });
});
