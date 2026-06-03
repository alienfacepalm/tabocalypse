import { describe, expect, it } from "vitest";
import { Cloud, CloudFog, CloudRain, CloudSun, Cloudy, Sun } from "lucide-react";

import {
  pickBuoyConditionIcon,
  pickBuoyConditionKind,
  pickWeatherConditionIcon,
  pickWeatherConditionKind,
  weatherConditionIconClassName,
  weatherConditionStrokeColor,
} from "./weather-condition-icon";

describe("pickWeatherConditionIcon", () => {
  it("maps clear and partly cloudy codes", () => {
    expect(pickWeatherConditionIcon(0)).toBe(Sun);
    expect(pickWeatherConditionIcon(2)).toBe(CloudSun);
  });

  it("maps fog and rain codes", () => {
    expect(pickWeatherConditionIcon(45)).toBe(CloudFog);
    expect(pickWeatherConditionIcon(61)).toBe(CloudRain);
  });
});

describe("pickWeatherConditionKind", () => {
  it("maps WMO codes to color kinds", () => {
    expect(pickWeatherConditionKind(0)).toBe("clear");
    expect(pickWeatherConditionKind(2)).toBe("partly");
    expect(pickWeatherConditionKind(45)).toBe("fog");
    expect(pickWeatherConditionKind(55)).toBe("drizzle");
    expect(pickWeatherConditionKind(61)).toBe("rain");
    expect(pickWeatherConditionKind(71)).toBe("snow");
    expect(pickWeatherConditionKind(95)).toBe("storm");
  });
});

describe("pickBuoyConditionIcon", () => {
  it("maps buoy condition text", () => {
    expect(pickBuoyConditionIcon("Sunny")).toBe(Sun);
    expect(pickBuoyConditionIcon("Overcast")).toBe(Cloud);
    expect(pickBuoyConditionIcon("Moderate")).toBe(Cloudy);
  });
});

describe("pickBuoyConditionKind", () => {
  it("maps buoy condition text to color kinds", () => {
    expect(pickBuoyConditionKind("Sunny")).toBe("clear");
    expect(pickBuoyConditionKind("Partly cloudy")).toBe("partly");
    expect(pickBuoyConditionKind("Overcast")).toBe("cloud");
    expect(pickBuoyConditionKind("Light rain")).toBe("rain");
    expect(pickBuoyConditionKind("Thunderstorms")).toBe("storm");
  });
});

describe("weatherConditionStrokeColor", () => {
  it("returns CSS variables for each kind", () => {
    expect(weatherConditionStrokeColor("clear")).toBe("var(--color-weather-clear)");
    expect(weatherConditionStrokeColor("rain")).toBe("var(--color-weather-rain)");
    expect(weatherConditionStrokeColor("storm")).toBe("var(--color-weather-storm)");
  });
});

describe("weatherConditionIconClassName", () => {
  it("includes base and kind modifier classes", () => {
    expect(weatherConditionIconClassName("rain")).toBe(
      "weather-condition-icon weather-condition-icon--rain",
    );
    expect(weatherConditionIconClassName("clear", "extra")).toBe(
      "weather-condition-icon weather-condition-icon--clear extra",
    );
  });
});
