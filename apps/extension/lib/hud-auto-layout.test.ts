import { describe, expect, it } from "vitest";
import {
  buildHudAutoLayoutItems,
  computeAutoHudPanelLayout,
  computeHudPanelAutoLayoutUpdates,
  fitHudPlacementsToFold,
  resolveHudLandMode,
  resolveHudLayoutDensity,
  resolveHudSpreadColumnCount,
} from "./hud-auto-layout";
import {
  DEFAULT_HUD_PANEL_POSITIONS,
  getHudLayoutMetrics,
  hudCanvasFoldBottomPx,
  mergeHudPanelPositions,
} from "./hud-layout";
import type { TWidgetKey } from "./settings";

const TEST_WIDGETS: Record<TWidgetKey, boolean> = {
  search: true,
  clock: true,
  notes: true,
  todo: true,
  weather: true,
  crypto: true,
  speedTest: false,
  aiChat: false,
  topSites: false,
  bookmarksStrip: false,
  tabGuilt: false,
  humorBanner: true,
};

describe("resolveHudLandMode", () => {
  it("uses roomy layout on wide viewports", () => {
    expect(resolveHudLandMode(1600, 900)).toBe("roomy");
  });

  it("uses tight layout on narrow viewports", () => {
    expect(resolveHudLandMode(520, 700)).toBe("tight");
  });
});

describe("resolveHudSpreadColumnCount", () => {
  it("adds columns as canvas width grows", () => {
    expect(resolveHudSpreadColumnCount(500, 6)).toBe(1);
    expect(resolveHudSpreadColumnCount(900, 6)).toBe(2);
    expect(resolveHudSpreadColumnCount(1200, 6)).toBe(3);
    expect(resolveHudSpreadColumnCount(1600, 6)).toBe(4);
  });
});

describe("resolveHudLayoutDensity", () => {
  it("detects shrink vs grow relative to previous canvas", () => {
    expect(resolveHudLayoutDensity(900, 700, 1200, 800)).toBe("compact");
    expect(resolveHudLayoutDensity(1400, 900, 1200, 800)).toBe("comfortable");
    expect(resolveHudLayoutDensity(1200, 800, 1200, 800)).toBe("balanced");
  });
});

describe("buildHudAutoLayoutItems", () => {
  it("includes enabled widgets but not canvas sticky notes", () => {
    const widgets = { ...TEST_WIDGETS };
    const items = buildHudAutoLayoutItems({
      widgets,
      hudPanelPositions: mergeHudPanelPositions(undefined),
      pluginDeckVisible: false,
    });
    const keys = items.map((i) => i.key);
    expect(keys).toContain("todo");
    expect(keys).toContain("weather");
    expect(keys).toContain("notes");
    expect(keys).not.toContain("note:n1");
    expect(keys).not.toContain("speedTest");
    expect(keys).not.toContain("pluginDeck");
  });

  it("omits the notes list panel from auto-layout when hidden", () => {
    const widgets = { ...TEST_WIDGETS };
    const items = buildHudAutoLayoutItems({
      widgets,
      hudPanelPositions: mergeHudPanelPositions(undefined),
      pluginDeckVisible: false,
      notesListPanelVisible: false,
    });
    const keys = items.map((i) => i.key);
    expect(keys).not.toContain("notes");
    expect(keys).toContain("todo");
  });
});

describe("fitHudPlacementsToFold", () => {
  it("pulls panels up so they do not extend below the fold", () => {
    const foldH = 500;
    const foldBottom = hudCanvasFoldBottomPx(foldH);
    const placements = [
      {
        key: "speedTest",
        panelId: "speedTest" as const,
        priority: 21,
        leftPx: 0,
        topPx: 420,
        widthPx: 320,
        heightPx: 180,
      },
    ];
    fitHudPlacementsToFold(placements, foldH);
    expect(placements[0]!.topPx + placements[0]!.heightPx).toBeLessThanOrEqual(foldBottom + 1);
  });
});

describe("computeAutoHudPanelLayout", () => {
  it("stacks panels in a single column on a narrow canvas", () => {
    const metrics = getHudLayoutMetrics(640, 720);
    expect(resolveHudLandMode(metrics.canvasW, metrics.canvasH)).toBe("tight");
    const items = buildHudAutoLayoutItems({
      widgets: { ...TEST_WIDGETS, bookmarksStrip: false },
      hudPanelPositions: DEFAULT_HUD_PANEL_POSITIONS,
      pluginDeckVisible: false,
    });
    const placed = computeAutoHudPanelLayout(items, metrics, "compact");
    expect(placed.size).toBe(items.length);
    const lefts = [...placed.values()].map((pos) => (pos.xPct / 100) * metrics.canvasW);
    expect(Math.max(...lefts) - Math.min(...lefts)).toBeLessThan(8);
  });

  it("keeps stacked panels above the fold on a short viewport", () => {
    const metrics = getHudLayoutMetrics(520, 480);
    const foldBottom = hudCanvasFoldBottomPx(metrics.canvasH);
    const items = buildHudAutoLayoutItems({
      widgets: { ...TEST_WIDGETS, speedTest: true, bookmarksStrip: true },
      hudPanelPositions: DEFAULT_HUD_PANEL_POSITIONS,
      pluginDeckVisible: false,
    });
    const placed = computeAutoHudPanelLayout(items, metrics, "compact");
    for (const pos of placed.values()) {
      const top = (pos.yPct / 100) * metrics.canvasH;
      const h = pos.heightPx ?? 160;
      expect(top + h).toBeLessThanOrEqual(foldBottom + 1);
    }
  });

  it("spreads panels horizontally on a wide viewport", () => {
    const metrics = getHudLayoutMetrics(1600, 900);
    const items = buildHudAutoLayoutItems({
      widgets: { ...TEST_WIDGETS, bookmarksStrip: true, tabGuilt: false },
      hudPanelPositions: DEFAULT_HUD_PANEL_POSITIONS,
      pluginDeckVisible: false,
    });
    const placed = computeAutoHudPanelLayout(items, metrics, "comfortable");
    const lefts = [...placed.values()].map((pos) => (pos.xPct / 100) * metrics.canvasW);
    const spread = Math.max(...lefts) - Math.min(...lefts);
    expect(spread).toBeGreaterThan(metrics.canvasW * 0.2);
  });

  it("uses most of column width in roomy mode", () => {
    const metrics = getHudLayoutMetrics(1600, 1000);
    const items = buildHudAutoLayoutItems({
      widgets: { ...TEST_WIDGETS, clock: false, tabGuilt: false },
      hudPanelPositions: DEFAULT_HUD_PANEL_POSITIONS,
      pluginDeckVisible: false,
    });
    const placed = computeAutoHudPanelLayout(items, metrics, "comfortable");
    const weather = placed.get("weather");
    expect(weather?.widthPx).toBeDefined();
    expect(weather!.widthPx!).toBeGreaterThan(280);
  });
});

describe("computeHudPanelAutoLayoutUpdates", () => {
  it("returns updates for all placed panels when onlyIfChanged is false", () => {
    const metrics = getHudLayoutMetrics(1200, 800);
    const input = {
      widgets: { ...TEST_WIDGETS, bookmarksStrip: false },
      hudPanelPositions: DEFAULT_HUD_PANEL_POSITIONS,
      pluginDeckVisible: false,
    };
    const items = buildHudAutoLayoutItems(input);
    const placed = computeAutoHudPanelLayout(items, metrics, "balanced");
    const updates = computeHudPanelAutoLayoutUpdates(input, metrics.canvasW, metrics.canvasH, {
      onlyIfChanged: false,
    });
    expect(Object.keys(updates).length).toBe(placed.size);
  });
});
