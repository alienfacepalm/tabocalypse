/** How the 10-day forecast lays out day cells in the Weather panel. */
export type TWeatherTenDayLayout = "row" | "stack";

/** Below this width the forecast always stacks vertically (e.g. weather beside clock). */
export const WEATHER_TEN_DAY_FORCE_STACK_MAX_WIDTH_PX = 520;

export function coerceWeatherTenDayLayout(
  value: unknown,
  fallback: TWeatherTenDayLayout,
): TWeatherTenDayLayout {
  return value === "row" || value === "stack" ? value : fallback;
}

/** Applies saved preference unless the panel is too narrow for a readable horizontal row. */
export function resolveWeatherTenDayLayout(
  preference: TWeatherTenDayLayout,
  containerWidthPx: number | null,
): TWeatherTenDayLayout {
  if (
    containerWidthPx != null &&
    containerWidthPx > 0 &&
    containerWidthPx < WEATHER_TEN_DAY_FORCE_STACK_MAX_WIDTH_PX
  ) {
    return "stack";
  }
  return preference;
}
