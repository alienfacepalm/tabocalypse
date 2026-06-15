/** How the 10-day forecast lays out day cells in the Weather panel. */
export type TWeatherTenDayLayout = "row" | "stack";

export function coerceWeatherTenDayLayout(
  value: unknown,
  fallback: TWeatherTenDayLayout,
): TWeatherTenDayLayout {
  if (value === "stack") return "stack";
  if (value === "row") return "stack";
  return fallback === "row" ? "stack" : fallback;
}

/** 10-day forecast always stacks vertically regardless of panel width or saved preference. */
export function resolveWeatherTenDayLayout(
  _preference: TWeatherTenDayLayout,
  _containerWidthPx: number | null,
): TWeatherTenDayLayout {
  return "stack";
}
