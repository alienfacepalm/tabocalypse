/** Weather HUD panel: current forecast, 10-day outlook, or 2 Lakes buoy readings. */
export type TWeatherPanelView = "forecast" | "tenDay" | "lakes";

export const WEATHER_PANEL_VIEWS: TWeatherPanelView[] = ["forecast", "tenDay", "lakes"];

export function coerceWeatherPanelView(
  value: unknown,
  fallback: TWeatherPanelView,
): TWeatherPanelView {
  return value === "forecast" || value === "tenDay" || value === "lakes" ? value : fallback;
}

/** Lakes is only available when the embed is enabled in Settings → Weather. */
export function resolveWeatherPanelView(
  panelView: TWeatherPanelView,
  lakesEmbedEnabled: boolean,
): TWeatherPanelView {
  if (panelView === "lakes" && !lakesEmbedEnabled) return "forecast";
  return panelView;
}
