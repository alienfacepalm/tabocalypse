import { describe, expect, it } from "vitest";
import {
  DEFAULT_HUD_PANEL_POSITIONS,
  HUD_LAYOUT_COLUMNS,
  HUD_SNAP_GRID_PX,
  clampHudPanelSize,
  clampHudScalar,
  computeHudDragCanvasRectPx,
  getHudGridDropHighlight,
  getHudLayoutMetrics,
  getHudPanelDropCellRange,
  listHudGridCells,
  mergeHudPanelPositions,
  resolveHudDropTargetPct,
  resolveHudGridDropCellRange,
  snapPanelOriginToLayoutGrid,
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

  it("preserves optional width and height when finite and positive", () => {
    const m = mergeHudPanelPositions({
      bookmarksStrip: { xPct: 1, yPct: 2, widthPx: 400, heightPx: 320 },
    });
    expect(m.bookmarksStrip).toEqual({ xPct: 1, yPct: 2, widthPx: 400, heightPx: 320 });
  });

  it("drops non-finite or non-positive width and height", () => {
    const m = mergeHudPanelPositions({
      todo: { xPct: 0, yPct: 0, widthPx: -1, heightPx: Number.NaN },
    });
    expect(m.todo).toEqual({ xPct: 0, yPct: 0 });
  });
});

describe("clampHudPanelSize", () => {
  it("clamps to panel limits and viewport padding", () => {
    expect(clampHudPanelSize("todo", 50, 50, 800, 600)).toEqual({ widthPx: 260, heightPx: 140 });
    expect(clampHudPanelSize("todo", 2000, 2000, 800, 600)).toEqual({
      widthPx: 784,
      heightPx: 584,
    });
  });
});

describe("HUD layout grid", () => {
  it("uses 12 columns", () => {
    expect(HUD_LAYOUT_COLUMNS).toBe(12);
    expect(HUD_SNAP_GRID_PX).toBeGreaterThan(0);
  });

  it("fills canvas with square-ish cells", () => {
    const m = getHudLayoutMetrics(1200, 800);
    expect(m.cols).toBe(12);
    expect(m.cellW).toBe(100);
    expect(m.rows).toBeGreaterThanOrEqual(1);
    expect(m.cellH * m.rows).toBeCloseTo(800, 5);
  });

  it("snaps panel origin to cell top-left", () => {
    const m = getHudLayoutMetrics(1200, 800);
    const snapped = snapPanelOriginToLayoutGrid(130, 90, m);
    expect(snapped).toEqual({ leftPx: 100, topPx: 100, col: 1, row: 1 });
  });

  it("highlights drop cells from anchor, not tiny pixels", () => {
    const m = getHudLayoutMetrics(1200, 800);
    const range = getHudPanelDropCellRange(1, 1, 220, 180, m);
    expect(range.colStart).toBe(1);
    expect(range.rowStart).toBe(1);
    expect(range.colEnd).toBeGreaterThan(2);
    expect(listHudGridCells(range).length).toBeGreaterThan(1);
  });

  it("builds drop highlight from drag position", () => {
    const m = getHudLayoutMetrics(1200, 800);
    const highlight = getHudGridDropHighlight(130, 90, 220, 180, m);
    const range = resolveHudGridDropCellRange(highlight, m);
    expect(range.colStart).toBe(1);
    expect(range.rowStart).toBe(1);
  });

  it("re-resolves drop cells when browser width changes", () => {
    const narrow = getHudLayoutMetrics(600, 800);
    const wide = getHudLayoutMetrics(1200, 800);
    const highlight = getHudGridDropHighlight(130, 90, 220, 180, narrow);
    const narrowRange = resolveHudGridDropCellRange(highlight, narrow);
    const wideRange = resolveHudGridDropCellRange(highlight, wide);
    expect(wide.cellW).toBeGreaterThan(narrow.cellW);
    expect(wideRange.colEnd - wideRange.colStart).toBeLessThanOrEqual(
      narrowRange.colEnd - narrowRange.colStart,
    );
  });

  it("resolves one drop-target percent rect (not per-cell)", () => {
    const m = getHudLayoutMetrics(1200, 800);
    const highlight = getHudGridDropHighlight(100, 100, 200, 150, m);
    const pct = resolveHudDropTargetPct(highlight, m);
    expect(pct.leftPct).toBeGreaterThanOrEqual(0);
    expect(pct.topPct).toBeGreaterThanOrEqual(0);
    expect(pct.widthPct + pct.leftPct).toBeLessThanOrEqual(100.00001);
    expect(pct.heightPct + pct.topPct).toBeLessThanOrEqual(100.00001);
  });
});

describe("computeHudDragCanvasRectPx", () => {
  it("snaps to layout cells on drop", () => {
    const m = getHudLayoutMetrics(1200, 800);
    const rect = computeHudDragCanvasRectPx(10, 10, 130, 90, 220, 180, m, true);
    expect(rect.leftPx).toBe(100);
    expect(rect.topPx).toBe(100);
    expect(rect.widthPx).toBe(220);
    expect(rect.heightPx).toBe(180);
  });
});
