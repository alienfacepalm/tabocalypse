import { Flame, Scale, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import React from "react";
import type { TPresetKey } from "../lib/settings";
import { HudTip } from "./hud-tip";

export const PRESET_PERSONALITY_LABELS: Record<TPresetKey, string> = {
  chaos: "Chaotic",
  balanced: "Balanced",
  focus: "Focus",
};

const PRESET_PERSONALITY_ITEMS: { key: TPresetKey; Icon: LucideIcon }[] = [
  { key: "chaos", Icon: Flame },
  { key: "balanced", Icon: Scale },
  { key: "focus", Icon: Target },
];

/** Active preset icon beside the Tabocalypse title — opens Settings > Chaos to change personality. */
export function PresetPersonalityIcons({
  preset,
  onOpenSettings,
}: {
  preset: TPresetKey;
  onOpenSettings: () => void;
}) {
  const visibleItems =
    preset === "focus"
      ? PRESET_PERSONALITY_ITEMS.filter((item) => item.key === "focus")
      : PRESET_PERSONALITY_ITEMS;

  return (
    <HudTip
      tip={
        preset === "focus"
          ? "Open Settings to change personality"
          : "Open Settings > Chaos to change personality"
      }
    >
      <button
        type="button"
        className="title-preset-trigger"
        onClick={onOpenSettings}
        aria-label={`${PRESET_PERSONALITY_LABELS[preset]} personality. Open Settings, Chaos section.`}
      >
        <span className="title-preset-icons" data-preset={preset} aria-hidden>
          {visibleItems.map(({ key, Icon }) => (
            <Icon
              key={key}
              size={18}
              strokeWidth={2}
              aria-hidden
              className={
                key === preset ? "title-preset-icon title-preset-icon-active" : "title-preset-icon"
              }
            />
          ))}
        </span>
      </button>
    </HudTip>
  );
}
