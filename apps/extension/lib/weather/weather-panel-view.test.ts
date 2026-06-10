import { describe, expect, it } from "vitest";
import { coerceWeatherPanelView, resolveWeatherPanelView } from "./weather-panel-view";

describe("coerceWeatherPanelView", () => {
  it("accepts forecast, tenDay, and lakes", () => {
    expect(coerceWeatherPanelView("forecast", "lakes")).toBe("forecast");
    expect(coerceWeatherPanelView("tenDay", "forecast")).toBe("tenDay");
    expect(coerceWeatherPanelView("lakes", "forecast")).toBe("lakes");
  });

  it("falls back for invalid values", () => {
    expect(coerceWeatherPanelView("radar", "forecast")).toBe("forecast");
    expect(coerceWeatherPanelView(undefined, "lakes")).toBe("lakes");
  });
});

describe("resolveWeatherPanelView", () => {
  it("maps lakes to forecast when the embed is off", () => {
    expect(resolveWeatherPanelView("lakes", false)).toBe("forecast");
    expect(resolveWeatherPanelView("lakes", true)).toBe("lakes");
  });

  it("keeps forecast and tenDay regardless of lakes embed", () => {
    expect(resolveWeatherPanelView("forecast", false)).toBe("forecast");
    expect(resolveWeatherPanelView("tenDay", false)).toBe("tenDay");
  });
});
