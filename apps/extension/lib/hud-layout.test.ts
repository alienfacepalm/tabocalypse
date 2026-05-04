import { describe, expect, it } from "vitest";
import {
  DEFAULT_HUD_PANEL_POSITIONS,
  HUD_SNAP_GRID_PX,
  clampHudScalar,
  mergeHudPanelPositions,
  snapScalarToGrid,
} from "./hud-layout";

describe("snapScalarToGrid", () => {
  it("rounds to the nearest grid multiple", () => {
    expect(snapScalarToGrid(10, 24)).toBe(0);
    expect(snapScalarToGrid(11, 24)).toBe(0);
    expect(snapScalarToGrid(12, 24)).toBe(24);
    expect(snapScalarToGrid(35, 24)).toBe(24);
    expect(snapScalarToGrid(37, 24)).toBe(48);
  });
});

describe("clampHudScalar", () => {
  it("clamps to inclusive bounds", () => {
    expect(clampHudScalar(5, 0, 10)).toBe(5);
    expect(clampHudScalar(-1, 0, 10)).toBe(0);
    expect(clampHudScalar(99, 0, 10)).toBe(10);
  });
});

describe("mergeHudPanelPositions", () => {
  it("fills from defaults when partial is undefined", () => {
    const m = mergeHudPanelPositions(undefined);
    expect(m).toEqual(DEFAULT_HUD_PANEL_POSITIONS);
  });

  it("overrides only provided keys with finite numbers", () => {
    const m = mergeHudPanelPositions({
      clock: { xPct: 10, yPct: 20 },
      notes: { xPct: Number.NaN, yPct: 5 },
    });
    expect(m.clock).toEqual({ xPct: 10, yPct: 20 });
    expect(m.notes).toEqual(DEFAULT_HUD_PANEL_POSITIONS.notes);
  });
});

describe("HUD_SNAP_GRID", () => {
  it("uses a positive grid size", () => {
    expect(HUD_SNAP_GRID_PX).toBeGreaterThan(0);
  });
});
