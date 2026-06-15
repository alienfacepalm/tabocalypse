import { describe, expect, it } from "vitest";
import type { TWidgetKey } from "./settings";
import {
  buildSystemStatusTelemetryPool,
  countEnabledWidgets,
  pickGlitchFalseVariant,
  resolveSystemStatusTelemetry,
  type ISystemStatusContext,
} from "./system-status-line";

function sampleWidgets(
  over: Partial<Record<TWidgetKey, boolean>> = {},
): Record<TWidgetKey, boolean> {
  return {
    search: true,
    clock: false,
    notes: true,
    todo: true,
    weather: false,
    crypto: false,
    speedTest: false,
    topSites: false,
    bookmarksStrip: false,
    tabGuilt: false,
    humorBanner: true,
    aiChat: false,
    balancedNews: false,
    ...over,
  };
}

function baseCtx(over: Partial<ISystemStatusContext> = {}): ISystemStatusContext {
  return {
    preset: "chaos",
    humorEnabled: true,
    humorIntensity: "mild",
    enabledWidgetCount: 5,
    noteCount: 0,
    openTodoCount: 0,
    lightTheme: false,
    ...over,
  };
}

describe("countEnabledWidgets", () => {
  it("counts toggles that are on", () => {
    const widgets = sampleWidgets();
    expect(countEnabledWidgets(widgets)).toBe(4);
  });
});

describe("resolveSystemStatusTelemetry", () => {
  it("returns a non-empty telemetry string in chaos preset", () => {
    expect(resolveSystemStatusTelemetry(baseCtx({ preset: "chaos" }))).toMatch(/^[A-Z0-9_]+: .+/);
  });

  it("returns empty telemetry in balanced preset", () => {
    expect(resolveSystemStatusTelemetry(baseCtx({ preset: "balanced" }))).toBe("");
  });

  it("adds chaos personality lines to the pool when preset is chaos", () => {
    const pool = buildSystemStatusTelemetryPool(baseCtx({ preset: "chaos" }));
    expect(pool).toContain("LAYOUT: CHAOTIC");
    expect(pool).toContain("GRID_SNAP: DISABLED");
  });

  it("adds humor-off lines when humor is disabled", () => {
    const pool = buildSystemStatusTelemetryPool(
      baseCtx({
        humorEnabled: false,
        humorIntensity: "off",
      }),
    );
    expect(pool).toContain("HUMOR_SUBSYSTEM: OFFLINE");
  });

  it("returns empty telemetry in focus preset", () => {
    expect(resolveSystemStatusTelemetry(baseCtx({ preset: "focus" }))).toBe("");
  });
});

describe("pickGlitchFalseVariant", () => {
  it("returns alternate spellings", () => {
    expect(pickGlitchFalseVariant(0)).not.toBe("FALSE");
    expect(pickGlitchFalseVariant(1)).toBeTruthy();
  });
});
