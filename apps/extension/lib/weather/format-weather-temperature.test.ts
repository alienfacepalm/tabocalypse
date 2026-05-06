import { describe, expect, it } from "vitest";
import { formatTemperatureValue } from "./format-weather-temperature";

describe("formatTemperatureValue", () => {
  it("uses locale decimal rules when a locale is provided", () => {
    expect(formatTemperatureValue(21.4, "celsius", "de-DE")).toMatch(/21,4/);
    expect(formatTemperatureValue(21.4, "fahrenheit", "de-DE")).toMatch(/21,4/);
  });

  it("still appends the temperature suffix", () => {
    const out = formatTemperatureValue(-3.5, "celsius", "en-US");
    expect(out.endsWith("°C")).toBe(true);
    expect(out).toContain("-3.5");
  });
});
