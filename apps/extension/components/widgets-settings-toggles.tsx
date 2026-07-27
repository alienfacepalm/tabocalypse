import React from "react";
import { PanelTip as HudTip } from "./panel-sdk";
import type { TPresetKey, TWidgetKey } from "../lib/settings";
import { WIDGET_LABELS } from "../lib/settings";
import {
  WIDGET_SETTINGS_ORDER,
  isWidgetSettingsToggleDisabled,
  widgetSettingsToggleTip,
} from "../lib/widgets-settings-toggles";

export function WidgetsSettingsToggles({
  widgets,
  preset,
  onToggle,
}: {
  widgets: Record<TWidgetKey, boolean>;
  preset: TPresetKey;
  onToggle: (key: TWidgetKey, on: boolean) => void;
}): React.JSX.Element {
  return (
    <div className="row wrap" role="group" aria-label="Widget panels">
      {WIDGET_SETTINGS_ORDER.map((key) => {
        const on = widgets[key];
        const disabled = isWidgetSettingsToggleDisabled(preset, key);
        const tip = widgetSettingsToggleTip(key, on, disabled);
        const label = WIDGET_LABELS[key];
        return (
          <HudTip key={key} tip={tip}>
            <button
              type="button"
              aria-pressed={on}
              aria-label={tip}
              title={disabled ? tip : undefined}
              disabled={disabled}
              className={on ? "btn primary" : "btn"}
              onClick={() => onToggle(key, !on)}
            >
              <span>{label}</span>
            </button>
          </HudTip>
        );
      })}
    </div>
  );
}
