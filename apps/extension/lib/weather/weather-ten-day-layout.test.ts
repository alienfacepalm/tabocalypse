import { describe, expect, it } from "vitest";
import { coerceWeatherTenDayLayout, resolveWeatherTenDayLayout } from "./weather-ten-day-layout";

describe("coerceWeatherTenDayLayout", () => {
  it("accepts stack and migrates row to stack", () => {
    expect(coerceWeatherTenDayLayout("stack", "stack")).toBe("stack");
    expect(coerceWeatherTenDayLayout("row", "stack")).toBe("stack");
  });

  it("falls back for invalid values", () => {
    expect(coerceWeatherTenDayLayout("grid", "stack")).toBe("stack");
    expect(coerceWeatherTenDayLayout(undefined, "stack")).toBe("stack");
    expect(coerceWeatherTenDayLayout(undefined, "row")).toBe("stack");
  });
});

describe("resolveWeatherTenDayLayout", () => {
  it("always returns stack", () => {
    expect(resolveWeatherTenDayLayout("row", 900)).toBe("stack");
    expect(resolveWeatherTenDayLayout("stack", 200)).toBe("stack");
    expect(resolveWeatherTenDayLayout("row", null)).toBe("stack");
  });
});
