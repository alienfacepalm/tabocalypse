import { describe, expect, it } from "vitest";
import { coerceWeatherTemperatureUnit } from "./weather-units";

describe("coerceWeatherTemperatureUnit", () => {
  it("returns valid literals unchanged", () => {
    expect(coerceWeatherTemperatureUnit("celsius", "fahrenheit")).toBe("celsius");
    expect(coerceWeatherTemperatureUnit("fahrenheit", "celsius")).toBe("fahrenheit");
  });

  it("falls back for unknown values", () => {
    expect(coerceWeatherTemperatureUnit("kelvin", "celsius")).toBe("celsius");
    expect(coerceWeatherTemperatureUnit(1, "fahrenheit")).toBe("fahrenheit");
    expect(coerceWeatherTemperatureUnit(undefined, "celsius")).toBe("celsius");
  });
});
