import type { INotePanel } from "./settings";

/** Identifiers for built-in HUD panels that support drag repositioning. */
export type THudPanelId =
  | "todo"
  | "clock"
  | "tabGuilt"
  | "weather"
  | "crypto"
  | "speedTest"
  | "aiChat"
  | "topSites"
  | "bookmarksStrip"
  | "notes"
  | "balancedNews"
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

/** Dashboard column count (see DESIGN.md fixed grid). */
export const HUD_LAYOUT_COLUMNS = 12;

export const HUD_PANEL_IDS: THudPanelId[] = [
  "todo",
  "clock",
  "tabGuilt",
  "weather",
  "crypto",
  "speedTest",
  "aiChat",
  "topSites",
  "bookmarksStrip",
  "notes",
  "balancedNews",
  "pluginDeck",
];

/** Approximates the previous three-column HUD on large screens. */
export const DEFAULT_HUD_PANEL_POSITIONS: Record<THudPanelId, IHudPanelPosition> = {
  todo: { xPct: 2, yPct: 2 },
  clock: { xPct: 2, yPct: 28 },
  tabGuilt: { xPct: 2, yPct: 56 },
  weather: { xPct: 34, yPct: 2 },
  crypto: { xPct: 70, yPct: 32 },
  speedTest: { xPct: 70, yPct: 58 },
  aiChat: { xPct: 70, yPct: 78 },
  topSites: { xPct: 34, yPct: 22 },
  bookmarksStrip: { xPct: 34, yPct: 40 },
  pluginDeck: { xPct: 34, yPct: 58 },
  notes: { xPct: 70, yPct: 2 },
  balancedNews: { xPct: 34, yPct: 72 },
};

/** Default outer size (px) aligned with {@link HUD_PANEL_WIDTH_CLASSES} (16px rem base). */
export const HUD_PANEL_DEFAULT_SIZE_PX: Record<THudPanelId, { widthPx: number; heightPx: number }> =
  {
    todo: { widthPx: 352, heightPx: 200 },
    clock: { widthPx: 352, heightPx: 200 },
    tabGuilt: { widthPx: 352, heightPx: 180 },
    weather: { widthPx: 576, heightPx: 280 },
    crypto: { widthPx: 448, heightPx: 240 },
    speedTest: { widthPx: 352, heightPx: 220 },
    aiChat: { widthPx: 384, heightPx: 320 },
    topSites: { widthPx: 576, heightPx: 240 },
    bookmarksStrip: { widthPx: 576, heightPx: 240 },
    pluginDeck: { widthPx: 896, heightPx: 320 },
    notes: { widthPx: 352, heightPx: 280 },
    balancedNews: { widthPx: 576, heightPx: 320 },
  };

/** Baseline canvas used to classify compact vs comfortable auto-layout. */
export const HUD_LAYOUT_REFERENCE_CANVAS = { widthPx: 1200, heightPx: 800 };

/** Inset from the visible HUD canvas bottom (the fold) when auto-fitting panels. */
export const HUD_LAYOUT_FOLD_PADDING_PX = 16;

/**
 * Space reserved for the fixed page footer (`.footer` in tailwind.css).
 * Keep in sync with `--hud-footer-reserve` so corner resize grips stay above the footer.
 */
export const HUD_PAGE_FOOTER_RESERVE_PX = 56;

/** Canvas height available for HUD panels, grid, and resize grips (above the fixed footer). */
export function hudCanvasInteractableHeightPx(canvasHeightPx: number): number {
  return Math.max(1, canvasHeightPx - HUD_PAGE_FOOTER_RESERVE_PX);
}

/** Bottom edge (px) of the visible HUD canvas — panels should stay at or above this when possible. */
export function hudCanvasFoldBottomPx(canvasHeightPx: number): number {
  return Math.max(1, hudCanvasInteractableHeightPx(canvasHeightPx) - HUD_LAYOUT_FOLD_PADDING_PX);
}

/** Vertical overlap between panels when they cannot fit above the fold without scrolling. */
export const HUD_LAYOUT_FOLD_OVERLAP_PX = 10;

export type THudLayoutDensity = "compact" | "balanced" | "comfortable";

export interface IHudAutoLayoutItem {
  /** Stable id (`todo`, `note:<noteId>`, …). */
  key: string;
  panelId: THudPanelId;
  position: IHudPanelPosition;
  priority: number;
}

export const HUD_PANEL_WIDTH_CLASSES: Record<THudPanelId, string> = {
  todo: "w-[min(22rem,calc(100vw-2rem))]",
  clock: "w-[min(22rem,calc(100vw-2rem))]",
  tabGuilt: "w-[min(22rem,calc(100vw-2rem))]",
  weather: "w-[min(36rem,calc(100vw-2rem))]",
  crypto: "w-[min(28rem,calc(100vw-2rem))]",
  speedTest: "w-[min(22rem,calc(100vw-2rem))]",
  aiChat: "w-[min(24rem,calc(100vw-2rem))]",
  topSites: "w-[min(36rem,calc(100vw-2rem))]",
  bookmarksStrip: "w-[min(36rem,calc(100vw-2rem))]",
  pluginDeck: "w-[min(56rem,calc(100vw-2rem))]",
  notes: "w-[min(22rem,calc(100vw-2rem))]",
  balancedNews: "w-[min(36rem,calc(100vw-2rem))]",
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
  crypto: { minW: 280, maxW: 1200, minH: 160, maxH: 1600 },
  speedTest: { minW: 260, maxW: 1200, minH: 160, maxH: 1600 },
  aiChat: { minW: 280, maxW: 1200, minH: 220, maxH: 1600 },
  topSites: { minW: 300, maxW: 1200, minH: 140, maxH: 1600 },
  bookmarksStrip: { minW: 300, maxW: 1200, minH: 140, maxH: 1600 },
  pluginDeck: { minW: 320, maxW: 1600, minH: 160, maxH: 2000 },
  notes: { minW: 260, maxW: 1200, minH: 160, maxH: 1600 },
  balancedNews: { minW: 300, maxW: 1200, minH: 200, maxH: 1600 },
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

/** Panel origin and size in HUD canvas coordinates (pixels). */
export interface IHudCanvasRectPx {
  leftPx: number;
  topPx: number;
  widthPx: number;
  heightPx: number;
}

/** Inclusive-start, exclusive-end cell indices on the HUD snap grid. */
export interface IHudGridCellRange {
  colStart: number;
  rowStart: number;
  colEnd: number;
  rowEnd: number;
}

/** Layout grid dimensions for the HUD canvas viewport. */
export interface IHudLayoutMetrics {
  cols: number;
  rows: number;
  cellW: number;
  cellH: number;
  canvasW: number;
  canvasH: number;
}

/** Drop-target anchor while dragging (cell indices; sizes come from live layout metrics). */
export interface IHudGridDropHighlight {
  anchorCol: number;
  anchorRow: number;
  panelWidthPx: number;
  panelHeightPx: number;
}

/**
 * Measure the HUD canvas viewport (the fold): visible client area, not scroll-extended content.
 * Matches what the user sees without scrolling the canvas.
 */
export function measureHudCanvasSize(canvas: HTMLElement): { widthPx: number; heightPx: number } {
  const rect = canvas.getBoundingClientRect();
  const widthPx = Math.max(1, canvas.clientWidth > 0 ? canvas.clientWidth : rect.width);
  const heightPx = Math.max(1, canvas.clientHeight > 0 ? canvas.clientHeight : rect.height);
  return { widthPx, heightPx };
}

const HUD_PANEL_ID_SET = new Set<string>(HUD_PANEL_IDS);

/** Live outer sizes for draggable HUD panels on the canvas (used by manual adjust-to-fit). */
export function measureHudPanelSizesOnCanvas(
  canvas: HTMLElement,
): Partial<Record<THudPanelId, { widthPx: number; heightPx: number }>> {
  const out: Partial<Record<THudPanelId, { widthPx: number; heightPx: number }>> = {};
  for (const el of canvas.querySelectorAll<HTMLElement>("[data-hud-panel-id]")) {
    const raw = el.dataset.hudPanelId;
    if (raw == null || !HUD_PANEL_ID_SET.has(raw)) continue;
    const panelId = raw as THudPanelId;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    out[panelId] = {
      widthPx: Math.round(rect.width),
      heightPx: Math.round(rect.height),
    };
  }
  return out;
}

/** Pulls a panel up when its bottom would sit below the visible canvas fold. */
export function clampHudPanelPositionToFold(
  canvas: HTMLElement,
  position: IHudPanelPosition,
  panelHeightPx: number,
): IHudPanelPosition {
  const { heightPx: canvasH } = measureHudCanvasSize(canvas);
  const foldBottom = hudCanvasFoldBottomPx(canvasH);
  const topPx = (position.yPct / 100) * canvasH;
  const h = position.heightPx ?? panelHeightPx;
  if (topPx + h <= foldBottom) return position;
  const maxTop = Math.max(0, foldBottom - h);
  return { ...position, yPct: (maxTop / canvasH) * 100 };
}

/** 12-column grid with square-ish cells filling the canvas height. */
export function getHudLayoutMetrics(
  canvasWidthPx: number,
  canvasHeightPx: number,
): IHudLayoutMetrics {
  const cols = HUD_LAYOUT_COLUMNS;
  const safeW = Math.max(1, canvasWidthPx);
  const canvasH = Math.max(1, canvasHeightPx);
  const interactableH = hudCanvasInteractableHeightPx(canvasH);
  const cellW = safeW / cols;
  const rows = Math.max(1, Math.floor(interactableH / cellW));
  const cellH = interactableH / rows;
  return { cols, rows, cellW, cellH, canvasW: safeW, canvasH };
}

/** Snaps a panel origin to the nearest layout cell (top-left of cell). */
export function snapPanelOriginToLayoutGrid(
  leftPx: number,
  topPx: number,
  metrics: IHudLayoutMetrics,
): { leftPx: number; topPx: number; col: number; row: number } {
  const col = clampHudScalar(Math.round(leftPx / metrics.cellW), 0, metrics.cols - 1);
  const row = clampHudScalar(Math.round(topPx / metrics.cellH), 0, metrics.rows - 1);
  return {
    leftPx: col * metrics.cellW,
    topPx: row * metrics.cellH,
    col,
    row,
  };
}

/** Grid cells a panel would occupy when its top-left is anchored at `(anchorCol, anchorRow)`. */
export function getHudPanelDropCellRange(
  anchorCol: number,
  anchorRow: number,
  panelWidthPx: number,
  panelHeightPx: number,
  metrics: IHudLayoutMetrics,
): IHudGridCellRange {
  const leftPx = anchorCol * metrics.cellW;
  const topPx = anchorRow * metrics.cellH;
  const rightPx = leftPx + Math.max(0, panelWidthPx);
  const bottomPx = topPx + Math.max(0, panelHeightPx);
  const colStart = clampHudScalar(anchorCol, 0, metrics.cols - 1);
  const rowStart = clampHudScalar(anchorRow, 0, metrics.rows - 1);
  const colEnd = clampHudScalar(
    Math.max(colStart + 1, Math.ceil(rightPx / metrics.cellW)),
    colStart + 1,
    metrics.cols,
  );
  const rowEnd = clampHudScalar(
    Math.max(rowStart + 1, Math.ceil(bottomPx / metrics.cellH)),
    rowStart + 1,
    metrics.rows,
  );
  return { colStart, rowStart, colEnd, rowEnd };
}

/** Drop preview anchor from a canvas position (snaps to nearest cell). */
export function getHudGridDropHighlight(
  leftPx: number,
  topPx: number,
  panelWidthPx: number,
  panelHeightPx: number,
  metrics: IHudLayoutMetrics,
): IHudGridDropHighlight {
  const snapped = snapPanelOriginToLayoutGrid(leftPx, topPx, metrics);
  return {
    anchorCol: snapped.col,
    anchorRow: snapped.row,
    panelWidthPx,
    panelHeightPx,
  };
}

/** Cell range for a drop highlight using current layout metrics (e.g. after browser resize). */
export function resolveHudGridDropCellRange(
  highlight: IHudGridDropHighlight,
  metrics: IHudLayoutMetrics,
): IHudGridCellRange {
  return getHudPanelDropCellRange(
    highlight.anchorCol,
    highlight.anchorRow,
    highlight.panelWidthPx,
    highlight.panelHeightPx,
    metrics,
  );
}

/** One rectangle covering snapped drop cells (% of full canvas grid; not per-cell boxes). */
export function resolveHudDropTargetPct(
  highlight: IHudGridDropHighlight,
  metrics: IHudLayoutMetrics,
): { leftPct: number; topPct: number; widthPct: number; heightPct: number } {
  const range = resolveHudGridDropCellRange(highlight, metrics);
  return {
    leftPct: (range.colStart / metrics.cols) * 100,
    topPct: (range.rowStart / metrics.rows) * 100,
    widthPct: ((range.colEnd - range.colStart) / metrics.cols) * 100,
    heightPct: ((range.rowEnd - range.rowStart) / metrics.rows) * 100,
  };
}

/** Lists occupied cells for highlight rendering. */
export function listHudGridCells(range: IHudGridCellRange): { col: number; row: number }[] {
  const cells: { col: number; row: number }[] = [];
  for (let row = range.rowStart; row < range.rowEnd; row += 1) {
    for (let col = range.colStart; col < range.colEnd; col += 1) {
      cells.push({ col, row });
    }
  }
  return cells;
}

/**
 * Canvas-space rect while dragging a panel (matches snap-on-drop when `snapPosition` is true).
 */
export function computeHudDragCanvasRectPx(
  originLeftCanvasPx: number,
  originTopCanvasPx: number,
  deltaClientX: number,
  deltaClientY: number,
  panelWidthPx: number,
  panelHeightPx: number,
  metrics: IHudLayoutMetrics,
  snapPosition: boolean,
): IHudCanvasRectPx {
  let leftPx = originLeftCanvasPx + deltaClientX;
  let topPx = originTopCanvasPx + deltaClientY;
  const maxLeft = Math.max(0, metrics.canvasW - panelWidthPx);
  const maxTop = Math.max(0, metrics.canvasH - panelHeightPx);
  if (snapPosition) {
    const snapped = snapPanelOriginToLayoutGrid(leftPx, topPx, metrics);
    leftPx = snapped.leftPx;
    topPx = snapped.topPx;
  }
  return {
    leftPx: clampHudScalar(leftPx, 0, maxLeft),
    topPx: clampHudScalar(topPx, 0, maxTop),
    widthPx: panelWidthPx,
    heightPx: panelHeightPx,
  };
}

export function clampHudScalar(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Resolved outer size for layout math (user resize or {@link HUD_PANEL_DEFAULT_SIZE_PX}). */
export function resolveHudPanelSizePx(
  panelId: THudPanelId,
  position: IHudPanelPosition,
  metrics: IHudLayoutMetrics,
): { widthPx: number; heightPx: number } {
  const def = HUD_PANEL_DEFAULT_SIZE_PX[panelId];
  const w = position.widthPx ?? def.widthPx;
  const h = position.heightPx ?? def.heightPx;
  return clampHudPanelSize(panelId, w, h, metrics.canvasW, metrics.canvasH);
}

/** Converts a canvas-space rect to stored percentage position (optional explicit px size). */
export function hudPositionFromCanvasRect(
  rect: IHudCanvasRectPx,
  size: { widthPx?: number; heightPx?: number },
  metrics: IHudLayoutMetrics,
): IHudPanelPosition {
  const pos: IHudPanelPosition = {
    xPct: (rect.leftPx / metrics.canvasW) * 100,
    yPct: (rect.topPx / metrics.canvasH) * 100,
  };
  if (typeof size.widthPx === "number" && Number.isFinite(size.widthPx) && size.widthPx > 0) {
    pos.widthPx = size.widthPx;
  }
  if (typeof size.heightPx === "number" && Number.isFinite(size.heightPx) && size.heightPx > 0) {
    pos.heightPx = size.heightPx;
  }
  return pos;
}

/** Default lift added while dragging/resizing so the active panel stacks above other HUD panels. */
export const HUD_DRAG_Z_LIFT = 100;

/** Per-monitor HUD panel overrides keyed by {@link getHudDisplayLayoutKey}. */
export type THudPanelPositionsByDisplay = Record<
  string,
  Partial<Record<THudPanelId, IHudPanelPosition>>
>;

/** Per-monitor active stickies keyed by {@link getHudDisplayLayoutKey}. */
export type TNotePanelsByDisplay = Record<string, INotePanel[]>;

/** Screen geometry used to fingerprint a monitor for HUD layout storage. */
export interface IHudDisplayScreenMetrics {
  availLeft: number;
  availTop: number;
  width: number;
  height: number;
}

const DEFAULT_SCREEN_FOR_HUD_DISPLAY_KEY: IHudDisplayScreenMetrics = {
  availLeft: 0,
  availTop: 0,
  width: 1920,
  height: 1080,
};

function readHudDisplayScreenMetrics(): IHudDisplayScreenMetrics {
  if (typeof window === "undefined") return DEFAULT_SCREEN_FOR_HUD_DISPLAY_KEY;
  const s = window.screen as unknown as IHudDisplayScreenMetrics;
  return {
    availLeft: s.availLeft,
    availTop: s.availTop,
    width: window.screen.width,
    height: window.screen.height,
  };
}

/** Stable key for the screen hosting the new tab (avail rect + size). */
export function getHudDisplayLayoutKey(
  screenLike: IHudDisplayScreenMetrics = readHudDisplayScreenMetrics(),
): string {
  return `${screenLike.availLeft},${screenLike.availTop},${screenLike.width},${screenLike.height}`;
}

/** Merges legacy/base positions with overrides for the active display. */
export function resolveHudPanelPositionsForDisplay(
  base: Record<THudPanelId, IHudPanelPosition>,
  byDisplay: THudPanelPositionsByDisplay | undefined,
  displayKey: string,
): Record<THudPanelId, IHudPanelPosition> {
  const displayPartial = byDisplay?.[displayKey];
  if (!displayPartial || Object.keys(displayPartial).length === 0) {
    return base;
  }
  return mergeHudPanelPositions({ ...base, ...displayPartial });
}

export function patchHudPanelPositionsForDisplay(
  byDisplay: THudPanelPositionsByDisplay | undefined,
  displayKey: string,
  updates: Partial<Record<THudPanelId, IHudPanelPosition>>,
): THudPanelPositionsByDisplay {
  const prev = byDisplay?.[displayKey] ?? {};
  return {
    ...(byDisplay ?? {}),
    [displayKey]: { ...prev, ...updates },
  };
}

export function resetHudPanelPositionsForDisplay(
  byDisplay: THudPanelPositionsByDisplay | undefined,
  displayKey: string,
): THudPanelPositionsByDisplay {
  return {
    ...(byDisplay ?? {}),
    [displayKey]: { ...DEFAULT_HUD_PANEL_POSITIONS },
  };
}

/** Resolves which stickies are on-screen for the active display. */
export function resolveNotePanelsForDisplay(
  base: readonly INotePanel[],
  byDisplay: TNotePanelsByDisplay | undefined,
  displayKey: string,
): INotePanel[] {
  if (byDisplay && displayKey in byDisplay) {
    return (byDisplay[displayKey] ?? []).map((panel) => ({ ...panel }));
  }
  return base.map((panel) => ({ ...panel }));
}

export function patchNotePanelsForDisplay(
  byDisplay: TNotePanelsByDisplay | undefined,
  displayKey: string,
  panels: INotePanel[],
): TNotePanelsByDisplay {
  return {
    ...(byDisplay ?? {}),
    [displayKey]: panels.map((panel) => ({ ...panel })),
  };
}

/** Removes a deleted note from every per-monitor sticky list. */
export function removeNoteFromAllDisplays(
  byDisplay: TNotePanelsByDisplay | undefined,
  noteId: string,
): TNotePanelsByDisplay {
  if (!byDisplay) return {};
  const next: TNotePanelsByDisplay = {};
  for (const [displayKey, panels] of Object.entries(byDisplay)) {
    next[displayKey] = panels.filter((panel) => panel.noteId !== noteId);
  }
  return next;
}

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
