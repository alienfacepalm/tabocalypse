import { describe, expect, it } from "vitest";
import {
  buildHudAutoLayoutItems,
  computeAutoHudPanelLayout,
  computeHudColumnStackLayoutUpdates,
  computeHudPanelAdjustLayoutUpdates,
  computeHudPanelAutoLayoutUpdates,
  fitHudPlacementsToFold,
  resolveHudLandMode,
  resolveHudLayoutDensity,
  resolveHudPanelResponsiveRect,
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
  steamCharts: false,
  aiChat: false,
  topSites: false,
  bookmarksStrip: false,
  tabGuilt: false,
  humorBanner: true,
  balancedNews: false,
};

describe("resolveHudPanelResponsiveRect", () => {
  function roomyBandWidth(canvasW: number): number {
    const gap = 20;
    const margin = 16;
    const cols = resolveHudSpreadColumnCount(canvasW, 4);
    return Math.floor((canvasW - margin * 2 - gap * (cols - 1)) / cols);
  }

  it("expands default-width panels to their column band on wide canvases", () => {
    const metrics = getHudLayoutMetrics(2560, 1200);
    const colWidth = roomyBandWidth(metrics.canvasW);
    const weather = resolveHudPanelResponsiveRect(
      "weather",
      DEFAULT_HUD_PANEL_POSITIONS.weather,
      metrics,
    );
    expect(weather.widthPx).toBeGreaterThanOrEqual(colWidth - 1);
    expect(weather.widthPx).toBeGreaterThan(576);
    const clock = resolveHudPanelResponsiveRect(
      "clock",
      DEFAULT_HUD_PANEL_POSITIONS.clock,
      metrics,
    );
    expect(clock.leftPx).toBeLessThan(weather.leftPx);
  });

  it("keeps explicit user width while still clamping to the canvas", () => {
    const metrics = getHudLayoutMetrics(2560, 1200);
    const rect = resolveHudPanelResponsiveRect(
      "weather",
      { ...DEFAULT_HUD_PANEL_POSITIONS.weather, widthPx: 640 },
      metrics,
    );
    expect(rect.widthPx).toBe(640);
  });
});

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

  const twoPanelWidgets = {
    ...TEST_WIDGETS,
    clock: false,
    tabGuilt: false,
    notes: false,
    crypto: false,
  };

  function roomyColumnWidth(canvasW: number, panelCount: number): number {
    const cols = resolveHudSpreadColumnCount(canvasW, panelCount);
    const gap = 20;
    const margin = 16;
    return (canvasW - margin * 2 - gap * (cols - 1)) / cols;
  }

  it("expands default-width panels to fill column land on wide screens", () => {
    const metrics = getHudLayoutMetrics(1600, 1000);
    const items = buildHudAutoLayoutItems({
      widgets: twoPanelWidgets,
      hudPanelPositions: DEFAULT_HUD_PANEL_POSITIONS,
      pluginDeckVisible: false,
    });
    expect(items).toHaveLength(2);
    const colWidth = roomyColumnWidth(metrics.canvasW, items.length);
    const placed = computeAutoHudPanelLayout(items, metrics, "comfortable");
    const todo = placed.get("todo");
    expect(todo?.widthPx).toBeDefined();
    expect(todo!.widthPx!).toBeGreaterThanOrEqual(Math.floor(colWidth) - 2);
  });

  it("keeps a user-widened panel up to the available column width", () => {
    const metrics = getHudLayoutMetrics(1600, 1000);
    const items = buildHudAutoLayoutItems({
      widgets: twoPanelWidgets,
      hudPanelPositions: {
        ...DEFAULT_HUD_PANEL_POSITIONS,
        todo: { ...DEFAULT_HUD_PANEL_POSITIONS.todo, widthPx: 500 },
      },
      pluginDeckVisible: false,
    });
    expect(items).toHaveLength(2);
    const colWidth = roomyColumnWidth(metrics.canvasW, items.length);
    const userWidth = Math.min(500, Math.floor(colWidth));
    const placed = computeAutoHudPanelLayout(items, metrics, "comfortable");
    const todo = placed.get("todo");
    expect(todo?.widthPx).toBe(userWidth);
  });

  it("fills column height up to the fold in roomy mode", () => {
    const metrics = getHudLayoutMetrics(1600, 900);
    const foldBottom = hudCanvasFoldBottomPx(metrics.canvasH);
    const items = buildHudAutoLayoutItems({
      widgets: {
        ...TEST_WIDGETS,
        clock: true,
        crypto: true,
        weather: true,
        bookmarksStrip: true,
        balancedNews: true,
        todo: false,
        notes: false,
        tabGuilt: false,
      },
      hudPanelPositions: DEFAULT_HUD_PANEL_POSITIONS,
      pluginDeckVisible: false,
    });
    const placed = computeAutoHudPanelLayout(items, metrics, "comfortable");
    for (const pos of placed.values()) {
      const top = (pos.yPct / 100) * metrics.canvasH;
      const h = pos.heightPx ?? 160;
      expect(top + h).toBeLessThanOrEqual(foldBottom + 1);
    }
    const colBottoms = [...placed.values()].map((pos) => {
      const top = (pos.yPct / 100) * metrics.canvasH;
      return top + (pos.heightPx ?? 0);
    });
    expect(Math.max(...colBottoms)).toBeGreaterThan(foldBottom - 80);
  });

  it("repacks overlapping saved positions when ignoreUserSizes is set", () => {
    const metrics = getHudLayoutMetrics(1600, 900);
    const overlapping = {
      xPct: 50,
      yPct: 35,
      widthPx: 320,
      heightPx: 360,
    };
    const input = {
      widgets: {
        ...TEST_WIDGETS,
        clock: true,
        crypto: true,
        weather: true,
        bookmarksStrip: true,
        balancedNews: true,
        todo: false,
        notes: false,
        tabGuilt: false,
      },
      hudPanelPositions: {
        ...DEFAULT_HUD_PANEL_POSITIONS,
        bookmarksStrip: overlapping,
        balancedNews: { xPct: 34, yPct: 40, widthPx: 720, heightPx: 420 },
      },
      pluginDeckVisible: false,
    };
    const updates = computeHudPanelAutoLayoutUpdates(input, metrics.canvasW, metrics.canvasH, {
      ignoreUserSizes: true,
      onlyIfChanged: true,
    });
    expect(Object.keys(updates).length).toBeGreaterThan(0);
    const rects = [
      ...computeAutoHudPanelLayout(buildHudAutoLayoutItems(input), metrics, "comfortable", {
        ignoreUserSizes: true,
      }).values(),
    ].map((pos) => ({
      left: (pos.xPct / 100) * metrics.canvasW,
      top: (pos.yPct / 100) * metrics.canvasH,
      w: pos.widthPx ?? 320,
      h: pos.heightPx ?? 200,
    }));
    for (let i = 0; i < rects.length; i += 1) {
      for (let j = i + 1; j < rects.length; j += 1) {
        const a = rects[i]!;
        const b = rects[j]!;
        const overlap =
          a.left < b.left + b.w &&
          a.left + a.w > b.left &&
          a.top < b.top + b.h &&
          a.top + a.h > b.top;
        expect(overlap).toBe(false);
      }
    }
  });

  it("repacks gapped saved column positions when ignoreUserSizes is set (new-tab bootstrap)", () => {
    const metrics = getHudLayoutMetrics(1920, 1080);
    const gappedColumn = {
      ...DEFAULT_HUD_PANEL_POSITIONS,
      clock: { xPct: 26, yPct: 4, widthPx: 420, heightPx: 160 },
      speedTest: { xPct: 26, yPct: 42, widthPx: 420, heightPx: 220 },
    };
    const input = {
      widgets: {
        ...TEST_WIDGETS,
        clock: true,
        speedTest: true,
        weather: true,
        crypto: true,
        bookmarksStrip: true,
        balancedNews: true,
        todo: false,
        notes: false,
        tabGuilt: false,
      },
      hudPanelPositions: gappedColumn,
      pluginDeckVisible: false,
    };
    const withoutIgnore = computeHudPanelAutoLayoutUpdates(
      input,
      metrics.canvasW,
      metrics.canvasH,
      {
        onlyIfChanged: true,
      },
    );
    const updates = computeHudPanelAutoLayoutUpdates(input, metrics.canvasW, metrics.canvasH, {
      onlyIfChanged: true,
      ignoreUserSizes: true,
    });
    expect(Object.keys(updates).length).toBeGreaterThan(0);
    expect(Object.keys(updates).length).toBeGreaterThanOrEqual(Object.keys(withoutIgnore).length);
  });
});

describe("computeHudPanelAdjustLayoutUpdates", () => {
  it("pulls panels up when they extend below the fold without changing width", () => {
    const metrics = getHudLayoutMetrics(1600, 700);
    const foldBottom = hudCanvasFoldBottomPx(metrics.canvasH);
    const balancedNews = {
      xPct: 34,
      yPct: 88,
      widthPx: 720,
      heightPx: 420,
    };
    const input = {
      widgets: {
        ...TEST_WIDGETS,
        clock: false,
        tabGuilt: false,
        notes: false,
        crypto: false,
        balancedNews: true,
      },
      hudPanelPositions: {
        ...DEFAULT_HUD_PANEL_POSITIONS,
        balancedNews,
      },
      pluginDeckVisible: false,
    };
    const updates = computeHudPanelAdjustLayoutUpdates(input, metrics.canvasW, metrics.canvasH);
    const next = updates.balancedNews;
    expect(next?.widthPx).toBe(720);
    const top = ((next?.yPct ?? 0) / 100) * metrics.canvasH;
    expect(top + (next?.heightPx ?? 0)).toBeLessThanOrEqual(foldBottom + 1);
  });

  it("nudges a lower-priority panel down when it overlaps a wider neighbor", () => {
    const metrics = getHudLayoutMetrics(1600, 900);
    const balancedNews = {
      xPct: 34,
      yPct: 40,
      widthPx: 720,
      heightPx: 420,
    };
    const bookmarksStrip = {
      xPct: 50,
      yPct: 35,
      widthPx: 320,
      heightPx: 360,
    };
    const input = {
      widgets: {
        ...TEST_WIDGETS,
        clock: false,
        todo: false,
        weather: false,
        notes: false,
        tabGuilt: false,
        crypto: false,
        bookmarksStrip: true,
        balancedNews: true,
      },
      hudPanelPositions: {
        ...DEFAULT_HUD_PANEL_POSITIONS,
        balancedNews,
        bookmarksStrip,
      },
      pluginDeckVisible: false,
    };
    const updates = computeHudPanelAdjustLayoutUpdates(input, metrics.canvasW, metrics.canvasH);
    expect(updates.bookmarksStrip?.yPct).toBeDefined();
    expect(updates.bookmarksStrip!.yPct!).toBeGreaterThan(bookmarksStrip.yPct);
    expect(updates.bookmarksStrip?.widthPx).toBe(320);
    if (updates.balancedNews != null) {
      expect(updates.balancedNews.widthPx).toBe(720);
      expect(updates.balancedNews.xPct).toBeGreaterThan(30);
    }
  });

  it("uses measured panel sizes when content is taller than stored defaults", () => {
    const metrics = getHudLayoutMetrics(1600, 700);
    const foldBottom = hudCanvasFoldBottomPx(metrics.canvasH);
    const balancedNews = { xPct: 34, yPct: 72, widthPx: 720 };
    const input = {
      widgets: {
        ...TEST_WIDGETS,
        clock: false,
        todo: false,
        weather: false,
        notes: false,
        tabGuilt: false,
        crypto: false,
        balancedNews: true,
      },
      hudPanelPositions: {
        ...DEFAULT_HUD_PANEL_POSITIONS,
        balancedNews,
      },
      pluginDeckVisible: false,
    };
    const measuredSizes = { balancedNews: { widthPx: 720, heightPx: 520 } };
    const updates = computeHudPanelAdjustLayoutUpdates(input, metrics.canvasW, metrics.canvasH, {
      measuredSizes,
    });
    const next = updates.balancedNews;
    expect(next?.widthPx).toBe(720);
    expect(next?.heightPx).toBeUndefined();
    expect(next?.yPct).toBeDefined();
    expect(next!.yPct!).toBeLessThan(balancedNews.yPct);
    const top = ((next?.yPct ?? 0) / 100) * metrics.canvasH;
    expect(top + 520).toBeLessThanOrEqual(foldBottom + 1);
  });

  it("preserves user-swapped panel sides when snapping to the grid", () => {
    const metrics = getHudLayoutMetrics(1600, 900);
    const weatherRight = { xPct: 55, yPct: 2, widthPx: 576, heightPx: 280 };
    const newsLeft = { xPct: 2, yPct: 40, widthPx: 720, heightPx: 420 };
    const input = {
      widgets: {
        ...TEST_WIDGETS,
        clock: false,
        todo: false,
        tabGuilt: false,
        crypto: false,
        notes: false,
        weather: true,
        balancedNews: true,
      },
      hudPanelPositions: {
        ...DEFAULT_HUD_PANEL_POSITIONS,
        weather: weatherRight,
        balancedNews: newsLeft,
      },
      pluginDeckVisible: false,
    };
    const autoUpdates = computeHudPanelAutoLayoutUpdates(input, metrics.canvasW, metrics.canvasH, {
      onlyIfChanged: false,
      ignoreUserSizes: true,
    });
    expect(autoUpdates.weather?.xPct ?? 0).toBeLessThan(weatherRight.xPct);

    const adjustUpdates = computeHudColumnStackLayoutUpdates(
      input,
      metrics.canvasW,
      metrics.canvasH,
    );
    const nextWeather = { ...weatherRight, ...adjustUpdates.weather };
    const nextNews = { ...newsLeft, ...adjustUpdates.balancedNews };
    expect(nextWeather.xPct).toBeGreaterThan(40);
    expect(nextNews.xPct).toBeLessThan(25);
  });

  it("does not shrink a wide saved width when the DOM is clamped narrower", () => {
    const metrics = getHudLayoutMetrics(900, 700);
    const balancedNews = { xPct: 34, yPct: 88, widthPx: 720, heightPx: 420 };
    const input = {
      widgets: {
        ...TEST_WIDGETS,
        clock: false,
        tabGuilt: false,
        notes: false,
        crypto: false,
        balancedNews: true,
      },
      hudPanelPositions: {
        ...DEFAULT_HUD_PANEL_POSITIONS,
        balancedNews,
      },
      pluginDeckVisible: false,
    };
    const measuredSizes = { balancedNews: { widthPx: 576, heightPx: 420 } };
    const updates = computeHudPanelAdjustLayoutUpdates(input, metrics.canvasW, metrics.canvasH, {
      measuredSizes,
    });
    const next = updates.balancedNews;
    if (next != null) {
      expect(next.widthPx).toBe(720);
      expect(next.heightPx).toBe(420);
    }
  });
});

describe("computeHudColumnStackLayoutUpdates", () => {
  it("stacks short panels in the same column and grows the stack to the fold", () => {
    const metrics = getHudLayoutMetrics(1600, 900);
    const foldBottom = hudCanvasFoldBottomPx(metrics.canvasH);
    const input = {
      widgets: {
        ...TEST_WIDGETS,
        clock: true,
        crypto: true,
        weather: false,
        todo: false,
        notes: false,
        tabGuilt: false,
        balancedNews: false,
        bookmarksStrip: false,
      },
      hudPanelPositions: {
        ...DEFAULT_HUD_PANEL_POSITIONS,
        clock: { xPct: 25, yPct: 2, widthPx: 352, heightPx: 200 },
        crypto: { xPct: 26, yPct: 55, widthPx: 448, heightPx: 240 },
      },
      pluginDeckVisible: false,
    };
    const updates = computeHudColumnStackLayoutUpdates(input, metrics.canvasW, metrics.canvasH);
    const clock = { ...input.hudPanelPositions.clock, ...updates.clock };
    const crypto = { ...input.hudPanelPositions.crypto, ...updates.crypto };
    expect(clock.xPct).toBeCloseTo(crypto.xPct!, 0);
    const clockBottom = ((clock.yPct ?? 0) / 100) * metrics.canvasH + (clock.heightPx ?? 0);
    const cryptoBottom = ((crypto.yPct ?? 0) / 100) * metrics.canvasH + (crypto.heightPx ?? 0);
    expect(cryptoBottom).toBeGreaterThan(clockBottom);
    expect(cryptoBottom).toBeLessThanOrEqual(foldBottom + 1);
  });

  it("keeps a lone wide panel in its column while filling height to the fold", () => {
    const metrics = getHudLayoutMetrics(1600, 900);
    const foldBottom = hudCanvasFoldBottomPx(metrics.canvasH);
    const input = {
      widgets: {
        ...TEST_WIDGETS,
        weather: true,
        clock: false,
        crypto: false,
        todo: false,
        notes: false,
        tabGuilt: false,
        balancedNews: false,
        bookmarksStrip: false,
      },
      hudPanelPositions: {
        ...DEFAULT_HUD_PANEL_POSITIONS,
        weather: { xPct: 2, yPct: 2, widthPx: 576, heightPx: 280 },
      },
      pluginDeckVisible: false,
    };
    const updates = computeHudColumnStackLayoutUpdates(input, metrics.canvasW, metrics.canvasH);
    const weather = { ...input.hudPanelPositions.weather, ...updates.weather };
    const bottom = ((weather.yPct ?? 0) / 100) * metrics.canvasH + (weather.heightPx ?? 0);
    expect(bottom).toBeLessThanOrEqual(foldBottom + 1);
    expect(weather.heightPx ?? 0).toBeGreaterThan(280);
  });

  it("returns a full-stack patch when any panel changes so columns stay aligned", () => {
    const metrics = getHudLayoutMetrics(1600, 900);
    const stackedWeather = { xPct: 1, yPct: 1, widthPx: 360, heightPx: 820 };
    const input = {
      widgets: {
        ...TEST_WIDGETS,
        weather: true,
        todo: true,
        clock: false,
        crypto: false,
        notes: false,
        tabGuilt: false,
        balancedNews: false,
        bookmarksStrip: false,
      },
      hudPanelPositions: {
        ...DEFAULT_HUD_PANEL_POSITIONS,
        weather: stackedWeather,
        todo: { xPct: 2, yPct: 40, widthPx: 352, heightPx: 200 },
      },
      pluginDeckVisible: false,
    };
    const updates = computeHudColumnStackLayoutUpdates(input, metrics.canvasW, metrics.canvasH);
    expect(Object.keys(updates)).toEqual(expect.arrayContaining(["weather", "todo"]));
    expect(updates.todo?.widthPx).toBe(updates.weather?.widthPx);
    expect(updates.todo?.xPct).toBeCloseTo(updates.weather?.xPct ?? 0, 0);
  });

  it("does not let a wide panel spill into the next column", () => {
    const metrics = getHudLayoutMetrics(1600, 900);
    const input = {
      widgets: {
        ...TEST_WIDGETS,
        weather: true,
        todo: true,
        clock: true,
        crypto: true,
        notes: false,
        tabGuilt: false,
        balancedNews: false,
        bookmarksStrip: false,
      },
      hudPanelPositions: {
        ...DEFAULT_HUD_PANEL_POSITIONS,
        weather: { xPct: 1, yPct: 1, widthPx: 720, heightPx: 320 },
        todo: { xPct: 1, yPct: 45, widthPx: 352, heightPx: 200 },
        clock: { xPct: 28, yPct: 1, widthPx: 352, heightPx: 200 },
        crypto: { xPct: 28, yPct: 35, widthPx: 448, heightPx: 240 },
      },
      pluginDeckVisible: false,
    };
    const updates = computeHudColumnStackLayoutUpdates(input, metrics.canvasW, metrics.canvasH);
    const rects = (["weather", "todo", "clock", "crypto"] as const).map((id) => {
      const pos = { ...input.hudPanelPositions[id], ...updates[id] };
      return {
        left: ((pos.xPct ?? 0) / 100) * metrics.canvasW,
        top: ((pos.yPct ?? 0) / 100) * metrics.canvasH,
        w: pos.widthPx ?? 320,
        h: pos.heightPx ?? 200,
      };
    });
    for (let i = 0; i < rects.length; i += 1) {
      for (let j = i + 1; j < rects.length; j += 1) {
        const a = rects[i]!;
        const b = rects[j]!;
        const overlap =
          a.left < b.left + b.w &&
          a.left + a.w > b.left &&
          a.top < b.top + b.h &&
          a.top + a.h > b.top;
        expect(overlap).toBe(false);
      }
    }
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

  it("omits fill widthPx so live column expansion can grow with the canvas", () => {
    const small = getHudLayoutMetrics(1280, 800);
    const large = getHudLayoutMetrics(2560, 1200);
    const fourPanelWidgets = {
      ...TEST_WIDGETS,
      clock: true,
      weather: true,
      crypto: true,
      speedTest: true,
      notes: false,
      todo: false,
      tabGuilt: false,
      bookmarksStrip: false,
      balancedNews: false,
    };
    const smallUpdates = computeHudPanelAutoLayoutUpdates(
      {
        widgets: fourPanelWidgets,
        hudPanelPositions: DEFAULT_HUD_PANEL_POSITIONS,
        pluginDeckVisible: false,
      },
      small.canvasW,
      small.canvasH,
      { ignoreUserSizes: true, onlyIfChanged: false },
    );
    expect(smallUpdates.weather?.widthPx).toBeUndefined();
    expect(smallUpdates.weather?.heightPx).toBeDefined();

    const staleNarrow = {
      ...DEFAULT_HUD_PANEL_POSITIONS,
      ...Object.fromEntries(
        Object.entries(smallUpdates).map(([id, pos]) => [id, { ...pos, widthPx: 320 }]),
      ),
    } as typeof DEFAULT_HUD_PANEL_POSITIONS;

    const largeUpdates = computeHudPanelAutoLayoutUpdates(
      {
        widgets: fourPanelWidgets,
        hudPanelPositions: staleNarrow,
        pluginDeckVisible: false,
      },
      large.canvasW,
      large.canvasH,
      { ignoreUserSizes: true, onlyIfChanged: false },
    );
    expect(largeUpdates.weather?.widthPx).toBeUndefined();

    const mergedWeather = {
      ...staleNarrow.weather,
      ...largeUpdates.weather,
    };
    // Simulate patch replace: auto-layout update without widthPx clears the stale stamp.
    const persistedWeather = {
      xPct: mergedWeather.xPct,
      yPct: mergedWeather.yPct,
      ...(largeUpdates.weather?.heightPx != null
        ? { heightPx: largeUpdates.weather.heightPx }
        : {}),
    };
    const live = resolveHudPanelResponsiveRect("weather", persistedWeather, large);
    const cols = resolveHudSpreadColumnCount(large.canvasW, 4);
    const colWidth = Math.floor((large.canvasW - 16 * 2 - 20 * (cols - 1)) / cols);
    expect(live.widthPx).toBeGreaterThanOrEqual(colWidth - 1);
    expect(live.widthPx).toBeGreaterThan(500);
  });
});
