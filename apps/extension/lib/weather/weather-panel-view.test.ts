import { describe, expect, it } from "vitest";
import { coerceWeatherPanelView } from "./weather-panel-view";

describe("coerceWeatherPanelView", () => {
  it("accepts forecast and lakes", () => {
    expect(coerceWeatherPanelView("forecast", "lakes")).toBe("forecast");
    expect(coerceWeatherPanelView("lakes", "forecast")).toBe("lakes");
  });

  it("falls back for invalid values", () => {
    expect(coerceWeatherPanelView("radar", "forecast")).toBe("forecast");
    expect(coerceWeatherPanelView(undefined, "lakes")).toBe("lakes");
  });
});
