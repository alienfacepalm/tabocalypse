import { describe, expect, it } from "vitest";
import {
  resolveTemperatureColorBand,
  resolveTemperatureColorClass,
  resolveTemperatureColorHex,
  toFahrenheitForTemperatureColor,
} from "./temperature-color-scale";

describe("toFahrenheitForTemperatureColor", () => {
  it("passes Fahrenheit through unchanged", () => {
    expect(toFahrenheitForTemperatureColor(64, "fahrenheit")).toBe(64);
  });

  it("converts Celsius for band lookup", () => {
    expect(toFahrenheitForTemperatureColor(18, "celsius")).toBeCloseTo(64.4, 1);
  });
});

describe("resolveTemperatureColorBand", () => {
  it("matches 2lakes.app Fahrenheit thresholds", () => {
    expect(resolveTemperatureColorBand(40, "fahrenheit")).toBe("indigo");
    expect(resolveTemperatureColorBand(50, "fahrenheit")).toBe("blue");
    expect(resolveTemperatureColorBand(64, "fahrenheit")).toBe("cyan");
    expect(resolveTemperatureColorBand(74, "fahrenheit")).toBe("emerald");
    expect(resolveTemperatureColorBand(80, "fahrenheit")).toBe("amber");
    expect(resolveTemperatureColorBand(90, "fahrenheit")).toBe("orange");
    expect(resolveTemperatureColorBand(110, "fahrenheit")).toBe("red");
    expect(resolveTemperatureColorBand(130, "fahrenheit")).toBe("red-hot");
  });

  it("uses the same absolute temperature in Celsius", () => {
    expect(resolveTemperatureColorBand(18, "celsius")).toBe("cyan");
  });

  it("returns neutral for invalid values", () => {
    expect(resolveTemperatureColorBand(Number.NaN, "fahrenheit")).toBe("neutral");
  });
});

describe("resolveTemperatureColorClass", () => {
  it("maps bands to temp-color utility classes", () => {
    expect(resolveTemperatureColorClass(64, "fahrenheit")).toBe("temp-color-cyan");
    expect(resolveTemperatureColorClass(130, "fahrenheit")).toBe("temp-color-red-hot");
  });
});

describe("resolveTemperatureColorHex", () => {
  it("returns band hex colors for rendering", () => {
    expect(resolveTemperatureColorHex(70.2, "fahrenheit")).toBe("#34d399");
    expect(resolveTemperatureColorHex(88.6, "fahrenheit")).toBe("#fb923c");
    expect(resolveTemperatureColorHex(Number.NaN, "fahrenheit")).toBeNull();
  });
});
