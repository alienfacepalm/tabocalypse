export interface IWeatherSnapshot {
  temperatureC: number;
  code: number;
  summary: string;
}

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

export async function fetchOpenMeteo(lat: number, lon: number): Promise<IWeatherSnapshot> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("current", "temperature_2m,weather_code");
  url.searchParams.set("temperature_unit", "celsius");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Weather HTTP ${res.status}`);
  const data = (await res.json()) as {
    current?: { temperature_2m?: number; weather_code?: number };
  };
  const t = data.current?.temperature_2m ?? NaN;
  const code = data.current?.weather_code ?? 0;
  if (Number.isNaN(t)) throw new Error("Bad weather payload");
  return {
    temperatureC: t,
    code,
    summary: CODE_SUMMARY[code] ?? "Weather",
  };
}
