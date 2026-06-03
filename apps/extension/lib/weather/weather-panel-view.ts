/** Weather HUD panel: Open-Meteo forecast vs 2 Lakes buoy readings. */
export type TWeatherPanelView = "forecast" | "lakes";

export const WEATHER_PANEL_VIEWS: TWeatherPanelView[] = ["forecast", "lakes"];

export function coerceWeatherPanelView(
  value: unknown,
  fallback: TWeatherPanelView,
): TWeatherPanelView {
  return value === "forecast" || value === "lakes" ? value : fallback;
}
