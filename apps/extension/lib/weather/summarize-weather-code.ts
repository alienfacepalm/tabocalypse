const CODE_SUMMARY: Record<number, string> = {
  0: "Clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Fog",
  51: "Drizzle",
  61: "Rain",
  71: "Snow",
  80: "Rain showers",
  95: "Thunderstorm",
};

export function summarizeWeatherCode(code: number): string {
  return CODE_SUMMARY[code] ?? "Weather";
}
