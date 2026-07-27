import { DEFAULT_WIDGETS, WIDGET_LABELS, type TPresetKey, type TWidgetKey } from "./settings";

/** Stable Settings > Widgets chip order (matches {@link DEFAULT_WIDGETS} insertion order). */
export const WIDGET_SETTINGS_ORDER = Object.keys(DEFAULT_WIDGETS) as TWidgetKey[];

/** Focus mode forces the humor banner off; its chip stays disabled. */
export function isWidgetSettingsToggleDisabled(preset: TPresetKey, key: TWidgetKey): boolean {
  return preset === "focus" && key === "humorBanner";
}

/** HudTip / title copy for a widget chip. */
export function widgetSettingsToggleTip(key: TWidgetKey, on: boolean, disabled: boolean): string {
  if (disabled) {
    return "Humor banner stays off in Focus mode. Change the preset under Settings > Chaos.";
  }
  const label = WIDGET_LABELS[key];
  return on ? `Hide ${label} on this monitor` : `Show ${label} on this monitor`;
}
