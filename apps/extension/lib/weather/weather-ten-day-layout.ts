/** How the 10-day forecast lays out day cells in the Weather panel. */
export type TWeatherTenDayLayout = "row" | "stack";

export const WEATHER_TEN_DAY_LAYOUTS: TWeatherTenDayLayout[] = ["row", "stack"];

export const WEATHER_TEN_DAY_LAYOUT_LABELS: Record<TWeatherTenDayLayout, string> = {
  row: "Row",
  stack: "Stack",
};

export function coerceWeatherTenDayLayout(
  value: unknown,
  fallback: TWeatherTenDayLayout,
): TWeatherTenDayLayout {
  return value === "row" || value === "stack" ? value : fallback;
}
