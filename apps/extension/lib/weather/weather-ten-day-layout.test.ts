import { describe, expect, it } from "vitest";
import {
  coerceWeatherTenDayLayout,
  resolveWeatherTenDayLayout,
  WEATHER_TEN_DAY_FORCE_STACK_MAX_WIDTH_PX,
} from "./weather-ten-day-layout";

describe("coerceWeatherTenDayLayout", () => {
  it("accepts row and stack", () => {
    expect(coerceWeatherTenDayLayout("row", "stack")).toBe("row");
    expect(coerceWeatherTenDayLayout("stack", "row")).toBe("stack");
  });

  it("falls back for invalid values", () => {
    expect(coerceWeatherTenDayLayout("grid", "stack")).toBe("stack");
    expect(coerceWeatherTenDayLayout(undefined, "stack")).toBe("stack");
  });
});

describe("resolveWeatherTenDayLayout", () => {
  it("forces stack in narrow panels", () => {
    expect(resolveWeatherTenDayLayout("row", WEATHER_TEN_DAY_FORCE_STACK_MAX_WIDTH_PX - 1)).toBe(
      "stack",
    );
  });

  it("keeps the saved preference in wide panels", () => {
    expect(resolveWeatherTenDayLayout("row", WEATHER_TEN_DAY_FORCE_STACK_MAX_WIDTH_PX)).toBe("row");
    expect(resolveWeatherTenDayLayout("stack", 900)).toBe("stack");
  });

  it("uses the saved preference before the container is measured", () => {
    expect(resolveWeatherTenDayLayout("row", null)).toBe("row");
  });
});
