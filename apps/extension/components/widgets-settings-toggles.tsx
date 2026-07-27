import React from "react";
import { Settings2 } from "lucide-react";
import { PanelTip as HudTip } from "./panel-sdk";
import type { TPresetKey, TWidgetKey } from "../lib/settings";
import { WIDGET_LABELS } from "../lib/settings";
import {
  WIDGET_SETTINGS_ORDER,
  isWidgetSettingsToggleDisabled,
  widgetSettingsToggleTip,
} from "../lib/widgets-settings-toggles";

export interface IWidgetSettingsToggleExtra {
  /** Leading mark for widgets that own a dedicated settings section. */
  icon?: React.ReactNode;
  /** Opens the dedicated settings section for this widget. */
  onOpenSettings?: () => void;
  settingsTip?: string;
}

export function WidgetsSettingsToggles({
  widgets,
  preset,
  onToggle,
  extras,
}: {
  widgets: Record<TWidgetKey, boolean>;
  preset: TPresetKey;
  onToggle: (key: TWidgetKey, on: boolean) => void;
  extras?: Partial<Record<TWidgetKey, IWidgetSettingsToggleExtra>>;
}): React.JSX.Element {
  return (
    <div className="row wrap" role="group" aria-label="Widget panels">
      {WIDGET_SETTINGS_ORDER.map((key) => {
        const on = widgets[key];
        const disabled = isWidgetSettingsToggleDisabled(preset, key);
        const tip = widgetSettingsToggleTip(key, on, disabled);
        const label = WIDGET_LABELS[key];
        const extra = extras?.[key];
        const settingsTip = extra?.settingsTip ?? `${label} settings`;
        return (
          <div key={key} className="inline-flex items-center gap-1">
            <HudTip tip={tip}>
              <button
                type="button"
                aria-pressed={on}
                aria-label={tip}
                title={disabled ? tip : undefined}
                disabled={disabled}
                className={[on ? "btn primary" : "btn", extra?.icon != null ? "has-icon" : ""]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onToggle(key, !on)}
              >
                {extra?.icon}
                <span>{label}</span>
              </button>
            </HudTip>
            {extra?.onOpenSettings ? (
              <HudTip tip={settingsTip}>
                <button
                  type="button"
                  className="btn ghost icon-only sm"
                  aria-label={settingsTip}
                  onClick={extra.onOpenSettings}
                >
                  <Settings2 size={16} strokeWidth={2} aria-hidden />
                </button>
              </HudTip>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
