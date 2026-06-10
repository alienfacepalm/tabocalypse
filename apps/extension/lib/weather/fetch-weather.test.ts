import { describe, expect, it } from "vitest";
import { parseOpenMeteoForecastPayload } from "./parse-open-meteo-forecast";

describe("parseOpenMeteoForecastPayload", () => {
  it("parses current conditions and up to ten daily rows", () => {
    const forecast = parseOpenMeteoForecastPayload(
      {
        current: { temperature_2m: 18.4, weather_code: 2 },
        daily: {
          time: ["2026-06-09", "2026-06-10", "2026-06-11"],
          weather_code: [2, 61, 0],
          temperature_2m_max: [22, 19, 24],
          temperature_2m_min: [14, 12, 15],
        },
      },
      "celsius",
    );

    expect(forecast.current.temperature).toBe(18.4);
    expect(forecast.current.summary).toBe("Partly cloudy");
    expect(forecast.daily).toHaveLength(3);
    expect(forecast.daily[0]).toMatchObject({
      date: "2026-06-09",
      high: 22,
      low: 14,
      summary: "Partly cloudy",
    });
    expect(forecast.daily[1]?.summary).toBe("Rain");
  });

  it("throws when current temperature is missing", () => {
    expect(() =>
      parseOpenMeteoForecastPayload(
        {
          current: { weather_code: 0 },
          daily: {
            time: ["2026-06-09"],
            weather_code: [0],
            temperature_2m_max: [20],
            temperature_2m_min: [10],
          },
        },
        "fahrenheit",
      ),
    ).toThrow("Bad weather payload");
  });

  it("throws when daily rows are empty", () => {
    expect(() =>
      parseOpenMeteoForecastPayload(
        {
          current: { temperature_2m: 70, weather_code: 0 },
          daily: { time: [], weather_code: [], temperature_2m_max: [], temperature_2m_min: [] },
        },
        "fahrenheit",
      ),
    ).toThrow("Bad weather payload");
  });
});
