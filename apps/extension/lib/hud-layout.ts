/** Identifiers for built-in HUD panels that support drag repositioning. */
export type THudPanelId =
  | "todo"
  | "clock"
  | "tabGuilt"
  | "weather"
  | "topSites"
  | "bookmarksStrip"
  | "notes"
  | "pluginDeck";

export interface IHudPanelPosition {
  /** Horizontal offset as percentage of the HUD canvas width (0–100). */
  xPct: number;
  /** Vertical offset as percentage of the HUD canvas height (0–100). */
  yPct: number;
}

/** Pixel step for snap-to-grid (canvas-relative). */
export const HUD_SNAP_GRID_PX = 24;

export const HUD_PANEL_IDS: THudPanelId[] = [
  "todo",
  "clock",
  "tabGuilt",
  "weather",
  "topSites",
  "bookmarksStrip",
  "notes",
  "pluginDeck",
];

/** Approximates the previous three-column HUD on large screens. */
export const DEFAULT_HUD_PANEL_POSITIONS: Record<THudPanelId, IHudPanelPosition> = {
  todo: { xPct: 2, yPct: 2 },
  clock: { xPct: 2, yPct: 28 },
  tabGuilt: { xPct: 2, yPct: 56 },
  weather: { xPct: 34, yPct: 2 },
  topSites: { xPct: 34, yPct: 22 },
  bookmarksStrip: { xPct: 34, yPct: 40 },
  pluginDeck: { xPct: 34, yPct: 58 },
  notes: { xPct: 70, yPct: 2 },
};

export const HUD_PANEL_WIDTH_CLASSES: Record<THudPanelId, string> = {
  todo: "w-[min(22rem,calc(100vw-2rem))]",
  clock: "w-[min(22rem,calc(100vw-2rem))]",
  tabGuilt: "w-[min(22rem,calc(100vw-2rem))]",
  weather: "w-[min(36rem,calc(100vw-2rem))]",
  topSites: "w-[min(36rem,calc(100vw-2rem))]",
  bookmarksStrip: "w-[min(36rem,calc(100vw-2rem))]",
  pluginDeck: "w-[min(56rem,calc(100vw-2rem))]",
  notes: "w-[min(22rem,calc(100vw-2rem))]",
};

export function snapScalarToGrid(value: number, gridPx: number): number {
  if (gridPx <= 0) return value;
  return Math.round(value / gridPx) * gridPx;
}

export function clampHudScalar(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function mergeHudPanelPositions(
  partial: Partial<Record<THudPanelId, IHudPanelPosition>> | undefined,
): Record<THudPanelId, IHudPanelPosition> {
  const base = { ...DEFAULT_HUD_PANEL_POSITIONS };
  if (!partial) return base;
  for (const id of HUD_PANEL_IDS) {
    const p = partial[id];
    if (p && Number.isFinite(p.xPct) && Number.isFinite(p.yPct)) {
      base[id] = { xPct: p.xPct, yPct: p.yPct };
    }
  }
  return base;
}
