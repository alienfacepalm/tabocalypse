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
  /** User-resized outer width in CSS pixels; omitted uses default width for the panel type. */
  widthPx?: number;
  /** User-resized outer height in CSS pixels; omitted uses content height up to the viewport cap. */
  heightPx?: number;
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

/** Min/max outer dimensions (px) when the user resizes a HUD panel. */
export const HUD_PANEL_SIZE_LIMITS: Record<
  THudPanelId,
  { minW: number; maxW: number; minH: number; maxH: number }
> = {
  todo: { minW: 260, maxW: 1200, minH: 140, maxH: 1600 },
  clock: { minW: 260, maxW: 1200, minH: 140, maxH: 1600 },
  tabGuilt: { minW: 260, maxW: 1200, minH: 120, maxH: 1200 },
  weather: { minW: 300, maxW: 1200, minH: 140, maxH: 1600 },
  topSites: { minW: 300, maxW: 1200, minH: 140, maxH: 1600 },
  bookmarksStrip: { minW: 300, maxW: 1200, minH: 140, maxH: 1600 },
  pluginDeck: { minW: 320, maxW: 1600, minH: 160, maxH: 2000 },
  notes: { minW: 260, maxW: 1200, minH: 160, maxH: 1600 },
};

export function clampHudPanelSize(
  panelId: THudPanelId,
  widthPx: number,
  heightPx: number,
  viewportW: number,
  viewportH: number,
): { widthPx: number; heightPx: number } {
  const L = HUD_PANEL_SIZE_LIMITS[panelId];
  const maxW = Math.min(L.maxW, Math.max(L.minW, viewportW - 16));
  const maxH = Math.min(L.maxH, Math.max(L.minH, viewportH - 16));
  return {
    widthPx: clampHudScalar(widthPx, L.minW, maxW),
    heightPx: clampHudScalar(heightPx, L.minH, maxH),
  };
}

export function snapScalarToGrid(value: number, gridPx: number): number {
  if (gridPx <= 0) return value;
  return Math.round(value / gridPx) * gridPx;
}

export function clampHudScalar(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Default lift added while dragging/resizing so the active panel stacks above other HUD panels. */
export const HUD_DRAG_Z_LIFT = 100;

export function mergeHudPanelPositions(
  partial: Partial<Record<THudPanelId, IHudPanelPosition>> | undefined,
): Record<THudPanelId, IHudPanelPosition> {
  const base = { ...DEFAULT_HUD_PANEL_POSITIONS };
  if (!partial) return base;
  for (const id of HUD_PANEL_IDS) {
    const p = partial[id];
    if (p && Number.isFinite(p.xPct) && Number.isFinite(p.yPct)) {
      const next: IHudPanelPosition = { xPct: p.xPct, yPct: p.yPct };
      if (typeof p.widthPx === "number" && Number.isFinite(p.widthPx) && p.widthPx > 0) {
        next.widthPx = p.widthPx;
      }
      if (typeof p.heightPx === "number" && Number.isFinite(p.heightPx) && p.heightPx > 0) {
        next.heightPx = p.heightPx;
      }
      base[id] = next;
    }
  }
  return base;
}
