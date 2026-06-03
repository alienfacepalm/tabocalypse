import { describe, expect, it } from "vitest";
import { mergeHudPanelPositions } from "./hud-layout";
import {
  buildHudPanelObstacleRects,
  computeStickyNoteResizeUpdates,
  fitStickyNotePositionForCanvas,
  stickyNotePositionEqual,
} from "./sticky-note-auto-layout";
import type { INotePanel, TWidgetKey } from "./settings";

const DEFAULT_STICKY_SIZE = { widthPx: 260, heightPx: 220 };

const TEST_WIDGETS: Record<TWidgetKey, boolean> = {
  search: true,
  clock: true,
  notes: true,
  todo: true,
  weather: true,
  crypto: false,
  speedTest: false,
  aiChat: false,
  topSites: false,
  bookmarksStrip: false,
  tabGuilt: false,
  humorBanner: true,
};

describe("stickyNotePositionEqual", () => {
  it("compares all placement fields", () => {
    const a = { xPx: 1, yPx: 2, widthPx: 260, heightPx: 220 };
    expect(stickyNotePositionEqual(a, { ...a })).toBe(true);
    expect(stickyNotePositionEqual(a, { ...a, xPx: 3 })).toBe(false);
  });
});

describe("fitStickyNotePositionForCanvas", () => {
  it("clamps a sticky that extends past the canvas edge", () => {
    const fitted = fitStickyNotePositionForCanvas(
      { xPx: 900, yPx: 600, widthPx: 260, heightPx: 220 },
      500,
      400,
      [],
    );
    expect(fitted.xPx).toBeLessThanOrEqual(500 - fitted.widthPx);
    expect(fitted.yPx).toBeLessThanOrEqual(400 - fitted.heightPx);
    expect(fitted.xPx).toBeGreaterThanOrEqual(0);
    expect(fitted.yPx).toBeGreaterThanOrEqual(0);
  });

  it("moves a sticky off a HUD obstacle when possible", () => {
    const obstacle = { leftPx: 16, topPx: 16, widthPx: 352, heightPx: 200 };
    const fitted = fitStickyNotePositionForCanvas(
      { xPx: 20, yPx: 20, widthPx: 260, heightPx: 220 },
      800,
      600,
      [obstacle],
    );
    const rect = {
      leftPx: fitted.xPx,
      topPx: fitted.yPx,
      widthPx: fitted.widthPx,
      heightPx: fitted.heightPx,
    };
    const overlap =
      rect.leftPx < obstacle.leftPx + obstacle.widthPx &&
      rect.leftPx + rect.widthPx > obstacle.leftPx &&
      rect.topPx < obstacle.topPx + obstacle.heightPx &&
      rect.topPx + rect.heightPx > obstacle.topPx;
    expect(overlap).toBe(false);
  });
});

describe("computeStickyNoteResizeUpdates", () => {
  const planInput = {
    widgets: TEST_WIDGETS,
    hudPanelPositions: mergeHudPanelPositions(undefined),
    pluginDeckVisible: false,
    notesListPanelVisible: true,
  };

  it("returns null when every unpinned sticky already fits", () => {
    const clearCanvasInput = {
      widgets: { ...TEST_WIDGETS, todo: false, clock: false, weather: false, notes: false },
      hudPanelPositions: mergeHudPanelPositions(undefined),
      pluginDeckVisible: false,
      notesListPanelVisible: false,
    };
    const panels: INotePanel[] = [
      {
        noteId: "n1",
        position: { xPx: 600, yPx: 40, ...DEFAULT_STICKY_SIZE },
      },
    ];
    const result = computeStickyNoteResizeUpdates(panels, clearCanvasInput, 1200, 800);
    expect(result).toBeNull();
  });

  it("skips pinned stickies", () => {
    const panels: INotePanel[] = [
      {
        noteId: "n1",
        pinned: true,
        position: { xPx: 900, yPx: 600, widthPx: 260, heightPx: 220 },
      },
    ];
    const result = computeStickyNoteResizeUpdates(panels, planInput, 500, 400);
    expect(result).toBeNull();
  });

  it("updates unpinned stickies that fall outside the canvas", () => {
    const panels: INotePanel[] = [
      {
        noteId: "n1",
        position: { xPx: 900, yPx: 600, widthPx: 260, heightPx: 220 },
      },
    ];
    const result = computeStickyNoteResizeUpdates(panels, planInput, 500, 400);
    expect(result).not.toBeNull();
    expect(result![0]?.position.xPx).toBeLessThanOrEqual(500 - result![0]!.position.widthPx);
    expect(result![0]?.position.yPx).toBeLessThanOrEqual(400 - result![0]!.position.heightPx);
  });

  it("onlyIfChanged false reflows unpinned stickies for explicit arrange", () => {
    const clearCanvasInput = {
      widgets: { ...TEST_WIDGETS, todo: false, clock: false, weather: false, notes: false },
      hudPanelPositions: mergeHudPanelPositions(undefined),
      pluginDeckVisible: false,
      notesListPanelVisible: false,
    };
    const position = { xPx: 600, yPx: 40, ...DEFAULT_STICKY_SIZE };
    const panels: INotePanel[] = [{ noteId: "n1", position }];
    expect(
      computeStickyNoteResizeUpdates(panels, clearCanvasInput, 1200, 800, { onlyIfChanged: true }),
    ).toBeNull();
    expect(
      computeStickyNoteResizeUpdates(panels, clearCanvasInput, 1200, 800, {
        onlyIfChanged: false,
      }),
    ).not.toBeNull();
  });
});

describe("buildHudPanelObstacleRects", () => {
  it("includes visible HUD widgets", () => {
    const rects = buildHudPanelObstacleRects(
      {
        widgets: TEST_WIDGETS,
        hudPanelPositions: mergeHudPanelPositions(undefined),
        pluginDeckVisible: false,
      },
      1200,
      800,
    );
    expect(rects.length).toBeGreaterThan(0);
    expect(rects.every((r) => r.widthPx > 0 && r.heightPx > 0)).toBe(true);
  });
});
