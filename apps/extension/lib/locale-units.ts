/**
 * Locale-aware defaults for measurement-style HUD preferences (temperature units, clock style).
 * Uses the browser locale region where possible so common defaults match heavily used locales
 * (e.g. Celsius for DE/FR/JP/BR/IN/CN/UK, Fahrenheit for US and a few nearby jurisdictions).
 */
import type { TClockHourFormat } from "./clock-hour-format";
import type { TWeatherTemperatureUnit } from "./weather/weather-units";

/**
 * ISO 3166-1 alpha-2 regions where weather forecasts are conventionally shown in °F
 * (United States and jurisdictions that align with US customary reporting).
 */
export const FAHRENHEIT_WEATHER_ISO_REGIONS = new Set<string>([
  "US",
  "PR",
  "GU",
  "VI",
  "AS",
  "UM",
  "BS",
  "BZ",
  "KY",
  "PW",
]);

function tryLocaleRegion(tag: string | undefined): string | undefined {
  if (!tag || typeof tag !== "string") return undefined;
  try {
    const loc = new Intl.Locale(tag);
    if (loc.region) return loc.region;
    const max = loc.maximize();
    return max.region ?? undefined;
  } catch {
    return undefined;
  }
}

/** BCP 47 locale string suitable for `Intl` formatters (falls back sensibly in extensions). */
export function getNavigatorFormattingLocale(): string {
  try {
    const fromIntl = Intl.DateTimeFormat().resolvedOptions().locale;
    if (typeof fromIntl === "string" && fromIntl.length > 0) return fromIntl;
  } catch {
    /* ignore */
  }
  if (typeof navigator !== "undefined" && navigator.language) return navigator.language;
  return "en-US";
}

/** Best-effort region for locale-driven defaults (may be undefined if the runtime omits it). */
export function getLikelyRegionFromNavigator(): string | undefined {
  if (typeof navigator === "undefined") return undefined;
  return tryLocaleRegion(navigator.language) ?? tryLocaleRegion(getNavigatorFormattingLocale());
}

export function inferWeatherTemperatureUnitFromNavigator(): TWeatherTemperatureUnit {
  const region = getLikelyRegionFromNavigator();
  if (region && FAHRENHEIT_WEATHER_ISO_REGIONS.has(region)) return "fahrenheit";
  return "celsius";
}

/** Uses the same hour-cycle convention as the resolved locale (covers major locales without a hardcoded country list). */
export function inferClockHourFormatFromNavigator(): TClockHourFormat {
  const locale = getNavigatorFormattingLocale();
  try {
    const hour12 = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hour12;
    return hour12 ? "12h" : "24h";
  } catch {
    return "24h";
  }
}

export function resolveEffectiveWeatherTemperatureUnit(input: {
  weatherTemperatureUnitAuto: boolean;
  weatherTemperatureUnit: TWeatherTemperatureUnit;
}): TWeatherTemperatureUnit {
  return input.weatherTemperatureUnitAuto
    ? inferWeatherTemperatureUnitFromNavigator()
    : input.weatherTemperatureUnit;
}

export function resolveEffectiveClockHourFormat(input: {
  clockHourFormatAuto: boolean;
  clockHourFormat: TClockHourFormat;
}): TClockHourFormat {
  return input.clockHourFormatAuto ? inferClockHourFormatFromNavigator() : input.clockHourFormat;
}
