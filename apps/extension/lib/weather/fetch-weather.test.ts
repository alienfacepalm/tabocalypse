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
          apparent_temperature_max: [21, 18, 23],
          apparent_temperature_min: [13, 11, 14],
          precipitation_probability_max: [35, 80, 5],
          precipitation_sum: [0.12, 4.2, 0],
          wind_speed_10m_max: [12, 18, 8],
          wind_direction_10m_dominant: [225, 180, 45],
          uv_index_max: [6.2, 3.1, 7],
          sunrise: ["2026-06-09T05:42", "2026-06-10T05:42", "2026-06-11T05:43"],
          sunset: ["2026-06-09T20:18", "2026-06-10T20:19", "2026-06-11T20:19"],
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
      precipChancePercent: 35,
      precipSum: 0.12,
      windSpeedMax: 12,
      windDirectionDegrees: 225,
      uvIndexMax: 6.2,
      sunrise: "2026-06-09T05:42",
      sunset: "2026-06-09T20:18",
      feelsLikeHigh: 21,
      feelsLikeLow: 13,
    });
    expect(forecast.daily[1]?.summary).toBe("Rain");
    expect(forecast.daily[1]?.precipChancePercent).toBe(80);
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
