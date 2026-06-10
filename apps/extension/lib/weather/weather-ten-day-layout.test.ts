import { describe, expect, it } from "vitest";
import { coerceWeatherTenDayLayout } from "./weather-ten-day-layout";

describe("coerceWeatherTenDayLayout", () => {
  it("accepts row and stack", () => {
    expect(coerceWeatherTenDayLayout("row", "stack")).toBe("row");
    expect(coerceWeatherTenDayLayout("stack", "row")).toBe("stack");
  });

  it("falls back for invalid values", () => {
    expect(coerceWeatherTenDayLayout("grid", "row")).toBe("row");
    expect(coerceWeatherTenDayLayout(undefined, "stack")).toBe("stack");
  });
});
