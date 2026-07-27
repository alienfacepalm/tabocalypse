import { describe, expect, it, vi } from "vitest";

vi.mock("webextension-polyfill", () => ({
  default: {
    storage: {
      sync: { get: vi.fn(), set: vi.fn() },
      local: { get: vi.fn(), set: vi.fn() },
    },
  },
}));

import { DEFAULT_WIDGETS, WIDGET_LABELS, type TWidgetKey } from "./settings";
import {
  WIDGET_SETTINGS_ORDER,
  isWidgetSettingsToggleDisabled,
  widgetSettingsToggleTip,
} from "./widgets-settings-toggles";

describe("WIDGET_SETTINGS_ORDER", () => {
  it("lists every default widget key exactly once", () => {
    const defaults = Object.keys(DEFAULT_WIDGETS) as TWidgetKey[];
    expect([...WIDGET_SETTINGS_ORDER].sort()).toEqual([...defaults].sort());
    expect(new Set(WIDGET_SETTINGS_ORDER).size).toBe(WIDGET_SETTINGS_ORDER.length);
  });

  it("has a non-empty label for every ordered key", () => {
    for (const key of WIDGET_SETTINGS_ORDER) {
      expect(WIDGET_LABELS[key]?.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("isWidgetSettingsToggleDisabled", () => {
  it("disables humor banner only in Focus mode", () => {
    expect(isWidgetSettingsToggleDisabled("focus", "humorBanner")).toBe(true);
    expect(isWidgetSettingsToggleDisabled("chaos", "humorBanner")).toBe(false);
    expect(isWidgetSettingsToggleDisabled("balanced", "humorBanner")).toBe(false);
    expect(isWidgetSettingsToggleDisabled("focus", "clock")).toBe(false);
  });
});

describe("widgetSettingsToggleTip", () => {
  it("explains Focus-mode humor lock and show/hide otherwise", () => {
    expect(widgetSettingsToggleTip("humorBanner", false, true)).toContain("Focus mode");
    expect(widgetSettingsToggleTip("humorBanner", false, true)).toContain("Settings > Chaos");
    expect(widgetSettingsToggleTip("clock", true, false)).toBe("Hide Clock on this monitor");
    expect(widgetSettingsToggleTip("clock", false, false)).toBe("Show Clock on this monitor");
  });
});
