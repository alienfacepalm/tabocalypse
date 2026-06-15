import { describe, expect, it } from "vitest";
import {
  DEFAULT_HUD_PANEL_POSITIONS,
  HUD_LAYOUT_COLUMNS,
  clampHudPanelSize,
  clampHudScalar,
  computeHudDragCanvasRectPx,
  getHudDisplayLayoutKey,
  formatHudDisplayLayoutLabel,
  getHudGridDropHighlight,
  getHudLayoutMetrics,
  getHudPanelDropCellRange,
  hudCanvasFoldBottomPx,
  hudCanvasInteractableHeightPx,
  hudCanvasMaxPanelTopPx,
  HUD_LAYOUT_FOLD_PADDING_PX,
  HUD_PAGE_FOOTER_RESERVE_PX,
  listHudGridCells,
  mergeHudPanelPositions,
  patchHudPanelPositionsForDisplay,
  patchNotePanelsForDisplay,
  resetHudPanelPositionsForDisplay,
  resolveHudPanelPositionsForDisplay,
  resolveNotePanelsForDisplay,
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

describe("hud canvas fold", () => {
  it("reserves space above the fixed page footer for panels and resize grips", () => {
    const canvasH = 900;
    expect(hudCanvasInteractableHeightPx(canvasH)).toBe(canvasH - HUD_PAGE_FOOTER_RESERVE_PX);
    expect(hudCanvasFoldBottomPx(canvasH)).toBe(
      hudCanvasInteractableHeightPx(canvasH) - HUD_LAYOUT_FOLD_PADDING_PX,
    );
    expect(hudCanvasMaxPanelTopPx(canvasH, 200)).toBe(hudCanvasFoldBottomPx(canvasH) - 200);
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

describe("per-display HUD panel positions", () => {
  const displayA = getHudDisplayLayoutKey({
    availLeft: 0,
    availTop: 0,
    width: 1920,
    height: 1080,
  });
  const displayB = getHudDisplayLayoutKey({
    availLeft: 1920,
    availTop: 0,
    width: 2560,
    height: 1440,
  });

  it("builds a stable display key from screen geometry", () => {
    expect(displayA).toBe("0,0,1920,1080");
    expect(displayB).toBe("1920,0,2560,1440");
  });

  it("uses base positions until a display override exists", () => {
    const base = mergeHudPanelPositions({ clock: { xPct: 5, yPct: 6 } });
    expect(resolveHudPanelPositionsForDisplay(base, {}, displayA).clock).toEqual({
      xPct: 5,
      yPct: 6,
    });
  });

  it("merges display-specific overrides without affecting other displays", () => {
    const base = mergeHudPanelPositions(undefined);
    const byDisplay = patchHudPanelPositionsForDisplay(undefined, displayA, {
      clock: { xPct: 11, yPct: 22 },
    });
    expect(resolveHudPanelPositionsForDisplay(base, byDisplay, displayA).clock).toEqual({
      xPct: 11,
      yPct: 22,
    });
    expect(resolveHudPanelPositionsForDisplay(base, byDisplay, displayB).clock).toEqual(base.clock);
  });

  it("resets only the active display layout bucket", () => {
    const byDisplay = patchHudPanelPositionsForDisplay(undefined, displayA, {
      clock: { xPct: 11, yPct: 22 },
    });
    const reset = resetHudPanelPositionsForDisplay(byDisplay, displayA);
    expect(reset[displayA]?.clock).toEqual(DEFAULT_HUD_PANEL_POSITIONS.clock);
    expect(reset[displayA]?.todo).toEqual(DEFAULT_HUD_PANEL_POSITIONS.todo);
  });
});

describe("per-display sticky note panels", () => {
  const displayA = getHudDisplayLayoutKey({
    availLeft: 0,
    availTop: 0,
    width: 1920,
    height: 1080,
  });
  const displayB = getHudDisplayLayoutKey({
    availLeft: 1920,
    availTop: 0,
    width: 2560,
    height: 1440,
  });
  const base = [
    {
      noteId: "n1",
      position: { xPx: 100, yPx: 50, widthPx: 260, heightPx: 220 },
    },
  ];

  it("uses base panels until a display override exists", () => {
    expect(resolveNotePanelsForDisplay(base, {}, displayA)).toEqual(base);
  });

  it("keeps display-specific stickies without affecting other displays", () => {
    const byDisplay = patchNotePanelsForDisplay(undefined, displayA, [
      {
        noteId: "n2",
        position: { xPx: 200, yPx: 80, widthPx: 260, heightPx: 220 },
      },
    ]);
    expect(resolveNotePanelsForDisplay(base, byDisplay, displayA)[0]?.noteId).toBe("n2");
    expect(resolveNotePanelsForDisplay(base, byDisplay, displayB)).toEqual(base);
  });

  it("honors an empty override when all stickies were closed on that display", () => {
    const byDisplay = patchNotePanelsForDisplay(undefined, displayA, []);
    expect(resolveNotePanelsForDisplay(base, byDisplay, displayA)).toEqual([]);
    expect(resolveNotePanelsForDisplay(base, byDisplay, displayB)).toEqual(base);
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
  });

  it("fills the interactable canvas with square-ish cells", () => {
    const m = getHudLayoutMetrics(1200, 800);
    const interactableH = hudCanvasInteractableHeightPx(800);
    expect(m.cols).toBe(12);
    expect(m.cellW).toBe(100);
    expect(m.rows).toBeGreaterThanOrEqual(1);
    expect(m.cellH * m.rows).toBeCloseTo(interactableH, 5);
  });

  it("snaps panel origin to cell top-left", () => {
    const m = getHudLayoutMetrics(1200, 800);
    const snapped = snapPanelOriginToLayoutGrid(130, 90, m);
    expect(snapped).toEqual({
      leftPx: 100,
      topPx: m.cellH,
      col: 1,
      row: 1,
    });
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

describe("formatHudDisplayLayoutLabel", () => {
  it("describes resolution and offset in plain language", () => {
    expect(
      formatHudDisplayLayoutLabel({
        availLeft: 0,
        availTop: 0,
        width: 1920,
        height: 1080,
      }),
    ).toBe("1920×1080, primary position");
    expect(
      formatHudDisplayLayoutLabel({
        availLeft: 1920,
        availTop: 0,
        width: 2560,
        height: 1440,
      }),
    ).toBe("2560×1440, offset (1920, 0)");
  });
});

describe("computeHudDragCanvasRectPx", () => {
  it("snaps to layout cells on drop", () => {
    const m = getHudLayoutMetrics(1200, 800);
    const rect = computeHudDragCanvasRectPx(10, 10, 130, 90, 220, 180, m, true);
    expect(rect.leftPx).toBe(100);
    expect(rect.topPx).toBe(m.cellH);
    expect(rect.widthPx).toBe(220);
    expect(rect.heightPx).toBe(180);
    expect(rect.topPx + rect.heightPx).toBeLessThanOrEqual(hudCanvasFoldBottomPx(m.canvasH));
  });
});
