import type { TWidgetKey } from "./settings";
import {
  HUD_PANEL_SIZE_LIMITS,
  getHudLayoutMetrics,
  type IHudAutoLayoutItem,
  type IHudCanvasRectPx,
  type IHudLayoutMetrics,
  type IHudPanelPosition,
  type THudLayoutDensity,
  type THudPanelId,
  clampHudPanelSize,
  clampHudScalar,
  HUD_LAYOUT_FOLD_OVERLAP_PX,
  HUD_LAYOUT_REFERENCE_CANVAS,
  hudCanvasFoldBottomPx,
  hudCanvasMaxPanelTopPx,
  hudPositionFromCanvasRect,
  resolveHudPanelSizePx,
  snapPanelOriginToLayoutGrid,
} from "./hud-layout";

export type { IHudAutoLayoutItem, THudLayoutDensity } from "./hud-layout";

/** Horizontal and vertical gap between panels in roomy (spread) layout. */
export const HUD_LAND_GAP_PX = 20;

/** Inset from canvas edges in auto layout. */
export const HUD_LAND_MARGIN_PX = 16;

/** Lower values are placed first (higher on screen / earlier in scan). */
export const HUD_AUTO_LAYOUT_PANEL_PRIORITY: Record<THudPanelId, number> = {
  weather: 0,
  notes: 1,
  todo: 2,
  clock: 3,
  tabGuilt: 4,
  topSites: 10,
  bookmarksStrip: 11,
  pluginDeck: 12,
  balancedNews: 8,
  steamCharts: 19,
  crypto: 20,
  speedTest: 21,
  aiChat: 22,
};

const WIDGET_TO_HUD_PANEL: Partial<Record<TWidgetKey, THudPanelId>> = {
  todo: "todo",
  clock: "clock",
  tabGuilt: "tabGuilt",
  weather: "weather",
  crypto: "crypto",
  speedTest: "speedTest",
  aiChat: "aiChat",
  steamCharts: "steamCharts",
  topSites: "topSites",
  bookmarksStrip: "bookmarksStrip",
  notes: "notes",
  balancedNews: "balancedNews",
};

/** How much HUD canvas is available — drives stack vs spread, not resize deltas alone. */
export type THudLandMode = "tight" | "roomy";

export function resolveHudLayoutDensity(
  canvasW: number,
  canvasH: number,
  prevW: number | undefined,
  prevH: number | undefined,
): THudLayoutDensity {
  const area = canvasW * canvasH;
  const refArea = HUD_LAYOUT_REFERENCE_CANVAS.widthPx * HUD_LAYOUT_REFERENCE_CANVAS.heightPx;
  if (prevW != null && prevH != null && prevW > 0 && prevH > 0) {
    const prevArea = prevW * prevH;
    if (area < prevArea * 0.92) return "compact";
    if (area > prevArea * 1.08) return "comfortable";
    return "balanced";
  }
  if (area < refArea * 0.78) return "compact";
  if (area > refArea * 1.22) return "comfortable";
  return "balanced";
}

/** Classify viewport from absolute size (available land), not from previous resize. */
export function resolveHudLandMode(canvasW: number, canvasH: number): THudLandMode {
  const area = canvasW * canvasH;
  const refArea = HUD_LAYOUT_REFERENCE_CANVAS.widthPx * HUD_LAYOUT_REFERENCE_CANVAS.heightPx;
  if (canvasW < 720 || canvasH < 420) return "tight";
  if (area < refArea * 0.55) return "tight";
  return "roomy";
}

export function resolveHudSpreadColumnCount(canvasW: number, panelCount: number): number {
  const n = Math.max(1, panelCount);
  if (canvasW < 640) return 1;
  if (canvasW < 960) return Math.min(2, n);
  if (canvasW < 1320) return Math.min(3, n);
  return Math.min(4, n);
}

export function buildHudAutoLayoutItems(input: {
  widgets: Record<TWidgetKey, boolean>;
  hudPanelPositions: Record<THudPanelId, IHudPanelPosition>;
  pluginDeckVisible: boolean;
  notesListPanelVisible?: boolean;
}): IHudAutoLayoutItem[] {
  const items: IHudAutoLayoutItem[] = [];
  for (const [widgetKey, panelId] of Object.entries(WIDGET_TO_HUD_PANEL) as [
    TWidgetKey,
    THudPanelId,
  ][]) {
    if (!input.widgets[widgetKey]) continue;
    if (widgetKey === "notes" && input.notesListPanelVisible === false) continue;
    items.push({
      key: panelId,
      panelId,
      position: input.hudPanelPositions[panelId],
      priority: HUD_AUTO_LAYOUT_PANEL_PRIORITY[panelId],
    });
  }
  if (input.pluginDeckVisible) {
    items.push({
      key: "pluginDeck",
      panelId: "pluginDeck",
      position: input.hudPanelPositions.pluginDeck,
      priority: HUD_AUTO_LAYOUT_PANEL_PRIORITY.pluginDeck,
    });
  }
  return items.sort((a, b) => a.priority - b.priority || a.key.localeCompare(b.key));
}

interface IHudPlacedPanelRect {
  key: string;
  panelId: THudPanelId;
  priority: number;
  leftPx: number;
  topPx: number;
  widthPx: number;
  heightPx: number;
}

interface IResolvedPanel {
  item: IHudAutoLayoutItem;
  widthPx: number;
  heightPx: number;
}

function hudPanelBoxesOverlap(a: IHudPlacedPanelRect, b: IHudPlacedPanelRect): boolean {
  const aRight = a.leftPx + a.widthPx;
  const bRight = b.leftPx + b.widthPx;
  const aBottom = a.topPx + a.heightPx;
  const bBottom = b.topPx + b.heightPx;
  return a.leftPx < bRight && aRight > b.leftPx && a.topPx < bBottom && aBottom > b.topPx;
}

function shrinkPlacementHeightsToSpan(
  placements: IHudPlacedPanelRect[],
  targetSpanPx: number,
): void {
  if (placements.length === 0) return;
  const minTop = Math.min(...placements.map((p) => p.topPx));
  const maxBottom = Math.max(...placements.map((p) => p.topPx + p.heightPx));
  const currentSpan = maxBottom - minTop;
  if (currentSpan <= targetSpanPx) return;

  const needRemove = currentSpan - targetSpanPx;
  const slackByPanel = placements.map((p) => ({
    p,
    slack: p.heightPx - HUD_PANEL_SIZE_LIMITS[p.panelId].minH,
  }));
  const totalSlack = slackByPanel.reduce((sum, e) => sum + Math.max(0, e.slack), 0);
  if (totalSlack <= 0) return;

  const remove = Math.min(needRemove, totalSlack);
  for (const { p, slack } of slackByPanel) {
    if (slack <= 0) continue;
    const delta = (slack / totalSlack) * remove;
    const minH = HUD_PANEL_SIZE_LIMITS[p.panelId].minH;
    p.heightPx = Math.max(minH, Math.round(p.heightPx - delta));
  }
}

function clampPlacementsAboveFold(placements: IHudPlacedPanelRect[], foldBottomPx: number): void {
  for (const p of placements) {
    const bottom = p.topPx + p.heightPx;
    if (bottom > foldBottomPx) {
      p.topPx = Math.max(0, foldBottomPx - p.heightPx);
    }
  }
}

function overlayPackOverflowToFold(placements: IHudPlacedPanelRect[], foldBottomPx: number): void {
  const overflow = placements.filter((p) => p.topPx + p.heightPx > foldBottomPx + 0.5);
  if (overflow.length === 0) return;

  const needsPack = new Set<IHudPlacedPanelRect>(overflow);
  let expanded = true;
  while (expanded) {
    expanded = false;
    for (const p of placements) {
      if (needsPack.has(p)) continue;
      for (const o of needsPack) {
        if (hudPanelBoxesOverlap(p, o)) {
          needsPack.add(p);
          expanded = true;
        }
      }
    }
  }

  const packList = [...needsPack].sort((a, b) => a.priority - b.priority);
  let cursorBottom = foldBottomPx;
  for (const p of packList) {
    p.topPx = Math.max(0, cursorBottom - p.heightPx);
    cursorBottom = p.topPx - HUD_LAYOUT_FOLD_OVERLAP_PX;
  }
}

export function fitHudPlacementsToFold(
  placements: IHudPlacedPanelRect[],
  foldHeightPx: number,
  options?: { shrinkHeights?: boolean },
): void {
  if (placements.length === 0) return;
  const foldBottomPx = hudCanvasFoldBottomPx(foldHeightPx);
  const minTop = Math.min(...placements.map((p) => p.topPx));
  const targetSpan = foldBottomPx - minTop;

  clampPlacementsAboveFold(placements, foldBottomPx);
  if (options?.shrinkHeights !== false) {
    shrinkPlacementHeightsToSpan(placements, targetSpan);
    clampPlacementsAboveFold(placements, foldBottomPx);
  }
  overlayPackOverflowToFold(placements, foldBottomPx);
}

function scaleResolvedHeightsToFold(
  resolved: IResolvedPanel[],
  foldHeightPx: number,
  gapPx: number,
): void {
  const foldBottomPx = hudCanvasFoldBottomPx(foldHeightPx);
  const gaps = Math.max(0, resolved.length - 1) * gapPx;
  const total = resolved.reduce((sum, r) => sum + r.heightPx, 0) + gaps;
  if (total <= foldBottomPx) return;

  const body = resolved.reduce((sum, r) => sum + r.heightPx, 0);
  const scale = (foldBottomPx - gaps) / body;
  for (const r of resolved) {
    const minH = HUD_PANEL_SIZE_LIMITS[r.item.panelId].minH;
    r.heightPx = Math.max(minH, Math.round(r.heightPx * scale));
  }
}

function hudPanelHasUserWidth(position: IHudPanelPosition): boolean {
  return position.widthPx != null && Number.isFinite(position.widthPx) && position.widthPx > 0;
}

/** Classic HUD uses three vertical bands on wide canvases (see DEFAULT_HUD_PANEL_POSITIONS). */
const HUD_RESPONSIVE_COLUMN_CAP = 3;

export interface IHudPanelResponsiveRect {
  leftPx: number;
  topPx: number;
  widthPx: number;
  heightPx: number;
}

/**
 * Live panel box for the HUD canvas: snap default-width panels into equal column bands and
 * expand to the band width on roomy viewports so wide monitors do not leave empty gutters.
 * Honors explicit user resizes ({@link IHudPanelPosition.widthPx}).
 */
export function resolveHudPanelResponsiveRect(
  panelId: THudPanelId,
  position: IHudPanelPosition,
  metrics: IHudLayoutMetrics,
): IHudPanelResponsiveRect {
  const storedLeftPx = (position.xPct / 100) * metrics.canvasW;
  const storedTopPx = (position.yPct / 100) * metrics.canvasH;
  const defaultSize = resolveHudPanelSizePx(panelId, position, metrics);

  if (hudPanelHasUserWidth(position)) {
    const widthPx = defaultSize.widthPx;
    const heightPx = defaultSize.heightPx;
    return {
      leftPx: clampHudScalar(storedLeftPx, 0, Math.max(0, metrics.canvasW - widthPx)),
      topPx: clampHudScalar(storedTopPx, 0, hudCanvasMaxPanelTopPx(metrics.canvasH, heightPx)),
      widthPx,
      heightPx,
    };
  }

  const landMode = resolveHudLandMode(metrics.canvasW, metrics.canvasH);
  if (landMode === "tight") {
    const margin = HUD_LAND_MARGIN_PX;
    const { widthPx, heightPx } = clampHudPanelSize(
      panelId,
      metrics.canvasW - margin * 2,
      defaultSize.heightPx,
      metrics.canvasW,
      metrics.canvasH,
    );
    return {
      leftPx: margin,
      topPx: clampHudScalar(storedTopPx, 0, hudCanvasMaxPanelTopPx(metrics.canvasH, heightPx)),
      widthPx,
      heightPx,
    };
  }

  const columnCount = Math.min(
    HUD_RESPONSIVE_COLUMN_CAP,
    resolveHudSpreadColumnCount(metrics.canvasW, HUD_RESPONSIVE_COLUMN_CAP),
  );
  const col = assignHudPanelColumnIndex(storedLeftPx, defaultSize.widthPx, columnCount, metrics);
  const margin = HUD_LAND_MARGIN_PX;
  const gap = HUD_LAND_GAP_PX;
  const innerW = metrics.canvasW - margin * 2 - gap * Math.max(0, columnCount - 1);
  const colWidth = Math.floor(innerW / columnCount);
  const leftPx = margin + col * (colWidth + gap);
  const { widthPx, heightPx } = clampHudPanelSize(
    panelId,
    colWidth,
    defaultSize.heightPx,
    metrics.canvasW,
    metrics.canvasH,
  );

  return {
    leftPx,
    topPx: clampHudScalar(storedTopPx, 0, hudCanvasMaxPanelTopPx(metrics.canvasH, heightPx)),
    widthPx,
    heightPx,
  };
}

export interface IHudAutoLayoutOptions {
  /** When true, panels expand to column/canvas width instead of honoring saved widths. */
  ignoreUserSizes?: boolean;
}

/**
 * Width for auto-arrange repack: fit the column or canvas first, then use spare width.
 * Explicit user resizes are kept up to that cap; otherwise panels expand to fill available land.
 */
function resolvePanelSizeForLand(
  item: IHudAutoLayoutItem,
  position: IHudPanelPosition,
  metrics: IHudLayoutMetrics,
  landMode: THudLandMode,
  columnInnerWidthPx?: number,
  layoutOptions?: IHudAutoLayoutOptions,
): { widthPx: number; heightPx: number } {
  const { widthPx: rawW, heightPx } = resolveHudPanelSizePx(item.panelId, position, metrics);
  const limits = HUD_PANEL_SIZE_LIMITS[item.panelId];
  const hasUserWidth = !layoutOptions?.ignoreUserSizes && hudPanelHasUserWidth(position);
  const canvasInnerW = metrics.canvasW - HUD_LAND_MARGIN_PX * 2;

  let widthPx = rawW;

  if (landMode === "roomy" && columnInnerWidthPx != null) {
    const maxW = Math.min(Math.floor(columnInnerWidthPx), limits.maxW, canvasInnerW);
    widthPx = hasUserWidth
      ? Math.min(maxW, Math.max(limits.minW, rawW))
      : Math.max(limits.minW, maxW);
  } else if (landMode === "tight") {
    const maxW = Math.min(limits.maxW, canvasInnerW);
    widthPx = hasUserWidth
      ? Math.min(maxW, Math.max(limits.minW, rawW))
      : Math.max(limits.minW, maxW);
  }

  return clampHudPanelSize(item.panelId, widthPx, heightPx, metrics.canvasW, metrics.canvasH);
}

/** Grows each masonry column so panels fill from their top edge down to the fold. */
function expandRoomyPlacementsToFold(
  placed: IHudPlacedPanelRect[],
  foldHeightPx: number,
  gapPx: number,
): void {
  if (placed.length === 0) return;
  const foldBottom = hudCanvasFoldBottomPx(foldHeightPx);
  const byColumn = new Map<number, IHudPlacedPanelRect[]>();
  for (const p of placed) {
    const col = byColumn.get(p.leftPx) ?? [];
    col.push(p);
    byColumn.set(p.leftPx, col);
  }

  for (const colPanels of byColumn.values()) {
    colPanels.sort((a, b) => a.topPx - b.topPx);
    const colTop = colPanels[0]!.topPx;
    const gaps = Math.max(0, colPanels.length - 1) * gapPx;
    const targetBody = foldBottom - colTop - gaps;
    if (targetBody <= 0) continue;

    const currentBody = colPanels.reduce((sum, p) => sum + p.heightPx, 0);
    const scale = currentBody > 0 ? targetBody / currentBody : 1;

    let y = colTop;
    let assigned = 0;
    for (let i = 0; i < colPanels.length; i += 1) {
      const p = colPanels[i]!;
      const limits = HUD_PANEL_SIZE_LIMITS[p.panelId];
      let newH: number;
      if (i === colPanels.length - 1) {
        newH = Math.max(limits.minH, Math.min(limits.maxH, targetBody - assigned));
      } else {
        newH = Math.max(limits.minH, Math.min(limits.maxH, Math.round(p.heightPx * scale)));
        assigned += newH;
      }
      p.heightPx = newH;
      p.topPx = y;
      y += newH + gapPx;
    }
  }
}

function hudPanelPositionToCanvasRect(
  item: IHudAutoLayoutItem,
  metrics: IHudLayoutMetrics,
  measuredSizes?: Partial<Record<THudPanelId, { widthPx: number; heightPx: number }>>,
): IHudPlacedPanelRect {
  const measured = measuredSizes?.[item.panelId];
  const resolved = resolveHudPanelSizePx(item.panelId, item.position, metrics);
  const { widthPx, heightPx } = clampHudPanelSize(
    item.panelId,
    measured?.widthPx ?? resolved.widthPx,
    measured?.heightPx ?? resolved.heightPx,
    metrics.canvasW,
    metrics.canvasH,
  );
  const leftPx = (item.position.xPct / 100) * metrics.canvasW;
  const topPx = (item.position.yPct / 100) * metrics.canvasH;
  const maxLeft = Math.max(0, metrics.canvasW - widthPx);
  const maxTop = hudCanvasMaxPanelTopPx(metrics.canvasH, heightPx);
  return {
    key: item.key,
    panelId: item.panelId,
    priority: item.priority,
    leftPx: clampHudScalar(leftPx, 0, maxLeft),
    topPx: clampHudScalar(topPx, 0, maxTop),
    widthPx,
    heightPx,
  };
}

/** Nudge lower-priority panels down to clear overlap while keeping size and horizontal position. */
function resolveHudPanelPlacementOverlaps(
  placements: IHudPlacedPanelRect[],
  metrics: IHudLayoutMetrics,
): void {
  const sorted = [...placements].sort(
    (a, b) => a.priority - b.priority || a.topPx - b.topPx || a.leftPx - b.leftPx,
  );
  const settled: IHudPlacedPanelRect[] = [];

  for (const panel of sorted) {
    const maxTop = hudCanvasMaxPanelTopPx(metrics.canvasH, panel.heightPx);
    let topPx = clampHudScalar(panel.topPx, 0, maxTop);

    for (let guard = 0; guard < 64; guard += 1) {
      const blocker = settled.find((other) => hudPanelBoxesOverlap({ ...panel, topPx }, other));
      if (!blocker) break;
      topPx = clampHudScalar(blocker.topPx + blocker.heightPx + HUD_LAND_GAP_PX, 0, maxTop);
    }

    panel.topPx = topPx;
    settled.push({ ...panel, topPx });
  }
}

/** Masonry columns with equal gaps — uses horizontal real estate on wide screens. */
function placeRoomySpreadLayout(
  resolved: IResolvedPanel[],
  metrics: IHudLayoutMetrics,
  layoutOptions?: IHudAutoLayoutOptions,
): IHudPlacedPanelRect[] {
  const placed: IHudPlacedPanelRect[] = [];
  const cols = resolveHudSpreadColumnCount(metrics.canvasW, resolved.length);
  const gap = HUD_LAND_GAP_PX;
  const margin = HUD_LAND_MARGIN_PX;
  const innerW = metrics.canvasW - margin * 2 - gap * (cols - 1);
  const colWidth = innerW / cols;
  const colTops = Array.from({ length: cols }, () => margin);

  for (const { item, widthPx: _w, heightPx: _h } of resolved) {
    let col = 0;
    for (let c = 1; c < cols; c += 1) {
      if (colTops[c]! < colTops[col]!) col = c;
    }

    const { widthPx, heightPx } = resolvePanelSizeForLand(
      item,
      item.position,
      metrics,
      "roomy",
      colWidth,
      layoutOptions,
    );

    const leftPx = margin + col * (colWidth + gap);
    const topPx = colTops[col]!;
    placed.push({
      key: item.key,
      panelId: item.panelId,
      priority: item.priority,
      leftPx,
      topPx,
      widthPx,
      heightPx,
    });
    colTops[col] = topPx + heightPx + gap;
  }

  return placed;
}

/** Single column, minimal width — for narrow or short viewports. */
function placeTightStackLayout(
  resolved: IResolvedPanel[],
  metrics: IHudLayoutMetrics,
  layoutOptions?: IHudAutoLayoutOptions,
): IHudPlacedPanelRect[] {
  const placed: IHudPlacedPanelRect[] = [];
  const gap = HUD_LAND_GAP_PX;
  const margin = HUD_LAND_MARGIN_PX;
  let topPx = margin;

  for (const { item } of resolved) {
    const { widthPx, heightPx } = resolvePanelSizeForLand(
      item,
      item.position,
      metrics,
      "tight",
      undefined,
      layoutOptions,
    );
    placed.push({
      key: item.key,
      panelId: item.panelId,
      priority: item.priority,
      leftPx: margin,
      topPx,
      widthPx,
      heightPx,
    });
    topPx += heightPx + gap;
  }

  return placed;
}

/**
 * Repacks visible HUD panels for the current canvas (land).
 * Roomy: multi-column masonry with equal spacing; tight: one column, sized down.
 */
export function computeAutoHudPanelLayout(
  items: readonly IHudAutoLayoutItem[],
  metrics: IHudLayoutMetrics,
  _density: THudLayoutDensity,
  layoutOptions?: IHudAutoLayoutOptions,
): Map<string, IHudPanelPosition> {
  const out = new Map<string, IHudPanelPosition>();
  if (items.length === 0) return out;

  const landMode = resolveHudLandMode(metrics.canvasW, metrics.canvasH);
  const resolved: IResolvedPanel[] = items.map((item) => {
    const size = resolvePanelSizeForLand(
      item,
      item.position,
      metrics,
      landMode,
      undefined,
      layoutOptions,
    );
    return { item, ...size };
  });

  if (landMode === "tight") {
    scaleResolvedHeightsToFold(resolved, metrics.canvasH, HUD_LAND_GAP_PX);
  }

  const placedRects =
    landMode === "roomy"
      ? placeRoomySpreadLayout(resolved, metrics, layoutOptions)
      : placeTightStackLayout(resolved, metrics, layoutOptions);

  if (landMode === "roomy") {
    expandRoomyPlacementsToFold(placedRects, metrics.canvasH, HUD_LAND_GAP_PX);
  }

  fitHudPlacementsToFold(placedRects, metrics.canvasH);

  for (const p of placedRects) {
    const rect: IHudCanvasRectPx = {
      leftPx: p.leftPx,
      topPx: p.topPx,
      widthPx: p.widthPx,
      heightPx: p.heightPx,
    };
    out.set(
      p.key,
      hudPositionFromCanvasRect(rect, { widthPx: p.widthPx, heightPx: p.heightPx }, metrics),
    );
  }

  return out;
}

/** Keyboard shortcut for manual HUD panel adjust-to-fit (header button uses the same action). */
export const HUD_ARRANGE_PANELS_KEYBOARD_SHORTCUT = "F10" as const;

export interface IHudAutoLayoutPlanInput {
  widgets: Record<TWidgetKey, boolean>;
  hudPanelPositions: Record<THudPanelId, IHudPanelPosition>;
  pluginDeckVisible: boolean;
  notesListPanelVisible?: boolean;
}

export function hudPanelPositionsEqual(a: IHudPanelPosition, b: IHudPanelPosition): boolean {
  return (
    a.xPct === b.xPct && a.yPct === b.yPct && a.widthPx === b.widthPx && a.heightPx === b.heightPx
  );
}

/** Compares only canvas origin — adjust-to-fit (F10) must not treat size drift as a move. */
export function hudPanelOriginEqual(a: IHudPanelPosition, b: IHudPanelPosition): boolean {
  return a.xPct === b.xPct && a.yPct === b.yPct;
}

/** True when the event target is a field where F-keys should not trigger HUD shortcuts. */
export function isHudKeyboardShortcutTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

/**
 * Computes panel position updates for auto-arrange (resize reflow or manual trigger).
 * Set {@link onlyIfChanged} to false for an explicit user arrange so panels always repack.
 */
export function computeHudPanelAutoLayoutUpdates(
  input: IHudAutoLayoutPlanInput,
  canvasW: number,
  canvasH: number,
  options?: {
    prevCanvasW?: number;
    prevCanvasH?: number;
    onlyIfChanged?: boolean;
    ignoreUserSizes?: boolean;
  },
): Partial<Record<THudPanelId, IHudPanelPosition>> {
  const metrics = getHudLayoutMetrics(canvasW, canvasH);
  const density = resolveHudLayoutDensity(
    canvasW,
    canvasH,
    options?.prevCanvasW,
    options?.prevCanvasH,
  );
  const items = buildHudAutoLayoutItems(input);
  const layoutOptions: IHudAutoLayoutOptions | undefined = options?.ignoreUserSizes
    ? { ignoreUserSizes: true }
    : undefined;
  const placed = computeAutoHudPanelLayout(items, metrics, density, layoutOptions);
  const onlyIfChanged = options?.onlyIfChanged !== false;
  const hudUpdates: Partial<Record<THudPanelId, IHudPanelPosition>> = {};
  for (const [key, pos] of placed) {
    const panelId = key as THudPanelId;
    const prev = input.hudPanelPositions[panelId];
    if (onlyIfChanged && prev != null && hudPanelPositionsEqual(prev, pos)) continue;
    hudUpdates[panelId] = pos;
  }
  return hudUpdates;
}

/**
 * Keeps each panel's saved position and size, snaps origins to the HUD grid, then nudges panels
 * that overlap neighbors or clip the canvas fold. Used for manual rearrange (F10 / header button).
 */
export function computeHudPanelAdjustLayoutUpdates(
  input: IHudAutoLayoutPlanInput,
  canvasW: number,
  canvasH: number,
  options?: {
    onlyIfChanged?: boolean;
    measuredSizes?: Partial<Record<THudPanelId, { widthPx: number; heightPx: number }>>;
    /** When true (default), panel origins align to the 12-column snap grid before overlap resolve. */
    snapToGrid?: boolean;
  },
): Partial<Record<THudPanelId, IHudPanelPosition>> {
  const metrics = getHudLayoutMetrics(canvasW, canvasH);
  const items = buildHudAutoLayoutItems(input);
  if (items.length === 0) return {};

  const placements = items.map((item) =>
    hudPanelPositionToCanvasRect(item, metrics, options?.measuredSizes),
  );
  if (options?.snapToGrid !== false) {
    snapHudPlacementsToGrid(placements, metrics);
  }
  resolveHudPanelPlacementOverlaps(placements, metrics);
  fitHudPlacementsToFold(placements, metrics.canvasH, { shrinkHeights: false });

  return placementsToHudUpdates(
    placements,
    input.hudPanelPositions,
    metrics,
    options?.onlyIfChanged !== false,
    { preserveSavedSizes: true },
  );
}

/** Nearest equal-width column band from the panel's left edge (wide panels must not spill into the next column). */
export function assignHudPanelColumnIndex(
  leftPx: number,
  _widthPx: number,
  columnCount: number,
  metrics: IHudLayoutMetrics,
): number {
  const margin = HUD_LAND_MARGIN_PX;
  const gap = HUD_LAND_GAP_PX;
  const cols = Math.max(1, columnCount);
  const innerW = metrics.canvasW - margin * 2 - gap * Math.max(0, cols - 1);
  const colWidth = innerW / cols;
  const band = colWidth + gap;
  const relative = leftPx - margin + colWidth * 0.5;
  if (relative <= 0) return 0;
  return clampHudScalar(Math.floor(relative / band), 0, cols - 1);
}

function resolveHudStackColumnCount(
  placements: readonly IHudPlacedPanelRect[],
  metrics: IHudLayoutMetrics,
): number {
  if (placements.length === 0) return 1;
  if (resolveHudLandMode(metrics.canvasW, metrics.canvasH) === "tight") return 1;
  const maxCols = resolveHudSpreadColumnCount(metrics.canvasW, placements.length);
  const usedCols = new Set(
    placements.map((p) => assignHudPanelColumnIndex(p.leftPx, p.widthPx, maxCols, metrics)),
  ).size;
  return Math.max(1, Math.min(maxCols, usedCols));
}

function stackHudPlacementsInColumns(
  placements: readonly IHudPlacedPanelRect[],
  items: readonly IHudAutoLayoutItem[],
  metrics: IHudLayoutMetrics,
  columnCount: number,
  layoutOptions?: IHudAutoLayoutOptions,
): IHudPlacedPanelRect[] {
  const gap = HUD_LAND_GAP_PX;
  const margin = HUD_LAND_MARGIN_PX;
  const cols = Math.max(1, columnCount);
  const innerW = metrics.canvasW - margin * 2 - gap * Math.max(0, cols - 1);
  const colWidth = innerW / cols;
  const itemByPanelId = new Map(items.map((item) => [item.panelId, item]));
  const columns: IHudPlacedPanelRect[][] = Array.from({ length: cols }, () => []);

  for (const p of placements) {
    const col = assignHudPanelColumnIndex(p.leftPx, p.widthPx, cols, metrics);
    columns[col]!.push(p);
  }

  const stacked: IHudPlacedPanelRect[] = [];
  for (let c = 0; c < cols; c += 1) {
    const colPanels = columns[c]!;
    if (colPanels.length === 0) continue;
    colPanels.sort((a, b) => a.topPx - b.topPx || a.priority - b.priority);
    const leftPx = margin + c * (colWidth + gap);
    let topPx = margin;
    for (const p of colPanels) {
      const item = itemByPanelId.get(p.panelId);
      const size =
        item != null
          ? resolvePanelSizeForLand(item, item.position, metrics, "roomy", colWidth, layoutOptions)
          : {
              widthPx: clampHudPanelSize(
                p.panelId,
                Math.min(p.widthPx, colWidth),
                p.heightPx,
                metrics.canvasW,
                metrics.canvasH,
              ).widthPx,
              heightPx: p.heightPx,
            };
      stacked.push({
        ...p,
        leftPx,
        topPx,
        widthPx: size.widthPx,
        heightPx: size.heightPx,
      });
      topPx += size.heightPx + gap;
    }
  }
  return stacked;
}

function snapHudPlacementsToGrid(
  placements: IHudPlacedPanelRect[],
  metrics: IHudLayoutMetrics,
): void {
  for (const p of placements) {
    const maxLeft = Math.max(0, metrics.canvasW - p.widthPx);
    const maxTop = hudCanvasMaxPanelTopPx(metrics.canvasH, p.heightPx);
    const snapped = snapPanelOriginToLayoutGrid(p.leftPx, p.topPx, metrics);
    p.leftPx = clampHudScalar(snapped.leftPx, 0, maxLeft);
    p.topPx = clampHudScalar(snapped.topPx, 0, maxTop);
  }
}

/** Aligns stacked panels to shared column origins and clamps widths so columns cannot overlap. */
function normalizeHudColumnStackPlacements(
  placements: IHudPlacedPanelRect[],
  columnCount: number,
  metrics: IHudLayoutMetrics,
  snapToGrid: boolean,
): void {
  const margin = HUD_LAND_MARGIN_PX;
  const gap = HUD_LAND_GAP_PX;
  const cols = Math.max(1, columnCount);
  const innerW = metrics.canvasW - margin * 2 - gap * Math.max(0, cols - 1);
  const colWidth = Math.floor(innerW / cols);
  const byCol = new Map<number, IHudPlacedPanelRect[]>();

  for (const p of placements) {
    const col = assignHudPanelColumnIndex(p.leftPx, p.widthPx, cols, metrics);
    const list = byCol.get(col) ?? [];
    list.push(p);
    byCol.set(col, list);
  }

  for (const [col, panels] of byCol) {
    let leftPx = margin + col * (colWidth + gap);
    if (snapToGrid) {
      leftPx = snapPanelOriginToLayoutGrid(leftPx, margin, metrics).leftPx;
    }
    for (const p of panels) {
      p.widthPx = colWidth;
      const maxLeft = Math.max(0, metrics.canvasW - p.widthPx);
      p.leftPx = clampHudScalar(leftPx, 0, maxLeft);
      if (snapToGrid) {
        const maxTop = hudCanvasMaxPanelTopPx(metrics.canvasH, p.heightPx);
        const snappedTop = snapPanelOriginToLayoutGrid(p.leftPx, p.topPx, metrics).topPx;
        p.topPx = clampHudScalar(snappedTop, 0, maxTop);
      }
    }
  }
}

function placementsToHudUpdates(
  placements: readonly IHudPlacedPanelRect[],
  prevPositions: Record<THudPanelId, IHudPanelPosition>,
  metrics: IHudLayoutMetrics,
  onlyIfChanged: boolean,
  options?: { preserveSavedSizes?: boolean },
): Partial<Record<THudPanelId, IHudPanelPosition>> {
  const hudUpdates: Partial<Record<THudPanelId, IHudPanelPosition>> = {};
  for (const p of placements) {
    const panelId = p.panelId;
    const prev = prevPositions[panelId];
    const rect: IHudCanvasRectPx = {
      leftPx: p.leftPx,
      topPx: p.topPx,
      widthPx: p.widthPx,
      heightPx: p.heightPx,
    };
    const size = options?.preserveSavedSizes
      ? { widthPx: prev?.widthPx, heightPx: prev?.heightPx }
      : { widthPx: p.widthPx, heightPx: p.heightPx };
    const pos = hudPositionFromCanvasRect(rect, size, metrics);
    if (onlyIfChanged && prev != null && hudPanelPositionsEqual(prev, pos)) continue;
    hudUpdates[panelId] = pos;
  }
  return hudUpdates;
}

/** Column stacks must patch every panel together — partial updates leave widths/positions out of sync. */
function placementsToHudColumnStackUpdates(
  placements: readonly IHudPlacedPanelRect[],
  prevPositions: Record<THudPanelId, IHudPanelPosition>,
  metrics: IHudLayoutMetrics,
  onlyIfChanged: boolean,
): Partial<Record<THudPanelId, IHudPanelPosition>> {
  const next: Partial<Record<THudPanelId, IHudPanelPosition>> = {};
  for (const p of placements) {
    const rect: IHudCanvasRectPx = {
      leftPx: p.leftPx,
      topPx: p.topPx,
      widthPx: p.widthPx,
      heightPx: p.heightPx,
    };
    next[p.panelId] = hudPositionFromCanvasRect(
      rect,
      { widthPx: p.widthPx, heightPx: p.heightPx },
      metrics,
    );
  }
  if (!onlyIfChanged) return next;

  let anyChanged = false;
  for (const [panelId, pos] of Object.entries(next) as [THudPanelId, IHudPanelPosition][]) {
    const prev = prevPositions[panelId];
    if (prev == null || !hudPanelPositionsEqual(prev, pos)) {
      anyChanged = true;
      break;
    }
  }
  return anyChanged ? next : {};
}

/**
 * Stacks panels vertically within column bands inferred from their horizontal placement,
 * then grows column heights to the canvas fold. Preserves which side each panel is on.
 */
export function computeHudColumnStackLayoutUpdates(
  input: IHudAutoLayoutPlanInput,
  canvasW: number,
  canvasH: number,
  options?: {
    onlyIfChanged?: boolean;
    measuredSizes?: Partial<Record<THudPanelId, { widthPx: number; heightPx: number }>>;
    snapToGrid?: boolean;
    layoutOptions?: IHudAutoLayoutOptions;
  },
): Partial<Record<THudPanelId, IHudPanelPosition>> {
  const metrics = getHudLayoutMetrics(canvasW, canvasH);
  const items = buildHudAutoLayoutItems(input);
  if (items.length === 0) return {};

  const seedPlacements = items.map((item) =>
    hudPanelPositionToCanvasRect(item, metrics, options?.measuredSizes),
  );
  const columnCount = resolveHudStackColumnCount(seedPlacements, metrics);
  const placements = stackHudPlacementsInColumns(
    seedPlacements,
    items,
    metrics,
    columnCount,
    options?.layoutOptions,
  );
  if (resolveHudLandMode(metrics.canvasW, metrics.canvasH) === "roomy") {
    expandRoomyPlacementsToFold(placements, metrics.canvasH, HUD_LAND_GAP_PX);
  }
  fitHudPlacementsToFold(placements, metrics.canvasH, { shrinkHeights: false });
  normalizeHudColumnStackPlacements(
    placements,
    columnCount,
    metrics,
    options?.snapToGrid !== false,
  );

  return placementsToHudColumnStackUpdates(
    placements,
    input.hudPanelPositions,
    metrics,
    options?.onlyIfChanged !== false,
  );
}
